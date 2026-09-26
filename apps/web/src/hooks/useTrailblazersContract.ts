import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers, type Contract, type Provider } from 'ethers';
import {
  TRAILBLAZERS_ABI,
  DEFAULT_CONTRACT_ADDRESS,
  TOTAL_CELLS,
  type CellState,
  type MoveEvent,
} from '@/lib/contract';
import { randomMockAddress, randomMockGas } from '@/lib/utils';

export type ConnectionStatus = 'connecting' | 'live' | 'http' | 'offline';

const MOVE_GAS_LIMIT = 300_000n;
const CELL_BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 2000;

interface TrailblazersState {
  cells: CellState[];
  moveEvents: MoveEvent[];
  pioneerGasSpent: bigint;
  followerGasSpent: bigint;
  playerScore: bigint;
  simulationEnabled: boolean;
  simCells: CellState[];
  simMoveEvents: MoveEvent[];
  simPioneerGasSpent: bigint;
  simFollowerGasSpent: bigint;
  connectionStatus: ConnectionStatus;
  pendingCell: number | null;
  lastError: string | null;
  contract: Contract | null;
  contractAddress: string;
}

function createInitialCells(): CellState[] {
  return Array.from({ length: TOTAL_CELLS }, (_, i) => ({
    id: i,
    visited: false,
    pioneer: '',
    visitCount: 0,
  }));
}

const createInitialState = (): TrailblazersState => {
  const cells = createInitialCells();
  return {
    cells,
    moveEvents: [],
    pioneerGasSpent: 0n,
    followerGasSpent: 0n,
    playerScore: 0n,
    simulationEnabled: false,
    simCells: cells.map((cell) => ({ ...cell })),
    simMoveEvents: [],
    simPioneerGasSpent: 0n,
    simFollowerGasSpent: 0n,
    connectionStatus: 'connecting',
    pendingCell: null,
    lastError: null,
    contract: null,
    contractAddress: DEFAULT_CONTRACT_ADDRESS,
  };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useTrailblazersContract(
  signer: ethers.Wallet | null,
  provider: Provider | null,
  contractAddress: string = DEFAULT_CONTRACT_ADDRESS,
) {
  const [state, setState] = useState<TrailblazersState>(createInitialState());

  const contractRef = useRef<Contract | null>(null);
  const readContractRef = useRef<Contract | null>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenEventKeys = useRef<Set<string>>(new Set());
  const lastPolledBlock = useRef<number>(0);

  const applyMoved = useCallback(
    (player: string, cellId: number, isPioneer: boolean, visitCount: number, gasUsed: bigint, txHash?: string) => {
      const key = `${txHash ?? ''}-${cellId}-${visitCount}-${player.toLowerCase()}`;
      if (seenEventKeys.current.has(key)) return;
      seenEventKeys.current.add(key);
      if (seenEventKeys.current.size > 200) {
        const entries = [...seenEventKeys.current];
        seenEventKeys.current = new Set(entries.slice(-100));
      }

      setState((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                visited: true,
                pioneer: c.visited && c.pioneer ? c.pioneer : player,
                visitCount,
              }
            : c,
        ),
        pioneerGasSpent: isPioneer ? prev.pioneerGasSpent + gasUsed : prev.pioneerGasSpent,
        followerGasSpent: isPioneer ? prev.followerGasSpent : prev.followerGasSpent + gasUsed,
        moveEvents: [
          {
            player,
            cellId,
            isPioneer,
            visitCount,
            gasUsed,
            timestamp: Date.now(),
            txHash,
          },
          ...prev.moveEvents,
        ].slice(0, 10),
      }));
    },
    [],
  );

  const loadInitialState = useCallback(async (contract: Contract) => {
    try {
      const [pioneerGas, followerGas] = await Promise.all([
        contract.totalPioneerGasSpent(),
        contract.totalFollowerGasSpent(),
      ]);

      setState((prev) => ({
        ...prev,
        pioneerGasSpent: pioneerGas,
        followerGasSpent: followerGas,
      }));

      if (signer?.address) {
        const score = await contract.playerScore(signer.address);
        setState((prev) => ({ ...prev, playerScore: score }));
      }

      const cells: CellState[] = [];
      for (let start = 0; start < TOTAL_CELLS; start += CELL_BATCH_SIZE) {
        const end = Math.min(start + CELL_BATCH_SIZE, TOTAL_CELLS);
        const batch = await Promise.all(
          Array.from({ length: end - start }, async (_, offset) => {
            const i = start + offset;
            const [vis, pio, count] = await Promise.all([
              contract.visited(i),
              contract.pioneer(i),
              contract.visitCount(i),
            ]);
            return {
              id: i,
              visited: vis,
              pioneer: pio,
              visitCount: Number(count),
            } as CellState;
          }),
        );
        cells.push(...batch);
        if (end < TOTAL_CELLS) await sleep(150);
      }

      setState((prev) => ({
        ...prev,
        cells: cells.map((loaded) => {
          const current = prev.cells[loaded.id];
          if (current && current.visitCount > loaded.visitCount) return current;
          return loaded;
        }),
      }));
    } catch {
      // offline — keep defaults
    }
  }, [signer]);

  const startHttpPolling = useCallback(
    async (httpContract: Contract, httpProvider: Provider) => {
      try {
        const block = await httpProvider.getBlockNumber();
        lastPolledBlock.current = Math.max(0, block - 5);
      } catch {
        lastPolledBlock.current = 0;
      }

      const poll = async () => {
        try {
          const fromBlock = lastPolledBlock.current + 1;
          const currentBlock = await httpProvider.getBlockNumber();
          if (currentBlock < fromBlock) return;

          const events = await httpContract.queryFilter(
            httpContract.filters.Moved(),
            fromBlock,
            currentBlock,
          );
          lastPolledBlock.current = currentBlock;

          for (const ev of events) {
            if (!('args' in ev) || !ev.args) continue;
            const [player, cellId, isPioneer, visitCount, gasUsed] = ev.args as unknown as [
              string,
              bigint,
              boolean,
              number | bigint,
              bigint,
            ];
            applyMoved(
              player,
              Number(cellId),
              Boolean(isPioneer),
              Number(visitCount),
              BigInt(gasUsed),
              ev.transactionHash,
            );
          }
        } catch {
          // transient RPC errors — keep polling
        }
      };

      poll();
      const interval = setInterval(() => {
        void poll();
      }, POLL_INTERVAL_MS);

      return () => clearInterval(interval);
    },
    [applyMoved],
  );

  useEffect(() => {
    if (!provider || !signer) {
      if (!provider) {
        setState((prev) => ({ ...prev, connectionStatus: 'offline' }));
      }
      return;
    }

    let cancelled = false;
    let pollCleanup: (() => void) | undefined;

    async function setup() {
      const httpContract = new ethers.Contract(contractAddress, TRAILBLAZERS_ABI, provider);
      const writeContract = new ethers.Contract(contractAddress, TRAILBLAZERS_ABI, signer);

      contractRef.current = writeContract;
      readContractRef.current = httpContract;

      if (cancelled) return;

      setState((prev) => ({
        ...prev,
        contract: writeContract,
        connectionStatus: 'http',
      }));

      await loadInitialState(httpContract);
      if (cancelled) return;

      if (!provider) {
        return;
      }

      pollCleanup = await startHttpPolling(httpContract, provider);
    }

    void setup();

    return () => {
      cancelled = true;
      pollCleanup?.();
      if (contractRef.current) {
        try {
          contractRef.current.removeAllListeners();
        } catch {
          // ignore
        }
      }
    };
  }, [provider, signer, contractAddress, loadInitialState, startHttpPolling]);

  const move = useCallback(async (cellId: number) => {
    if (!contractRef.current) return;
    setState((prev) => ({ ...prev, pendingCell: cellId, lastError: null }));
    try {
      const tx = await contractRef.current.move(cellId, { gasLimit: MOVE_GAS_LIMIT });
      const receipt = await tx.wait();
      const txHash = receipt?.hash ?? tx.hash;

      let appliedFromReceipt = false;
      if (receipt && readContractRef.current) {
        try {
          for (const log of receipt.logs ?? []) {
            try {
              const parsed = readContractRef.current.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });
              if (parsed?.name !== 'Moved') continue;
              const [player, eventCellId, isPioneer, visitCount, gasUsed] = parsed.args as unknown as [
                string,
                bigint,
                boolean,
                number | bigint,
                bigint,
              ];
              if (Number(eventCellId) !== cellId) continue;
              applyMoved(player, cellId, Boolean(isPioneer), Number(visitCount), BigInt(gasUsed), txHash);
              appliedFromReceipt = true;
              break;
            } catch {
              // not our log
            }
          }
        } catch {
          // fall through to chain read
        }
      }

      if (!appliedFromReceipt && readContractRef.current) {
        const read = readContractRef.current;
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            if (attempt > 0) await sleep(400);
            const [vis, pio, count] = await Promise.all([
              read.visited(cellId),
              read.pioneer(cellId),
              read.visitCount(cellId),
            ]);
            if (!vis) continue;
            const visitCount = Number(count);
            applyMoved(pio || (signer?.address ?? ''), cellId, visitCount === 1, visitCount, 0n, txHash);
            const [pioneerGas, followerGas, score] = await Promise.all([
              read.totalPioneerGasSpent(),
              read.totalFollowerGasSpent(),
              signer?.address ? read.playerScore(signer.address) : Promise.resolve(0n),
            ]);
            setState((prev) => ({
              ...prev,
              pioneerGasSpent: pioneerGas,
              followerGasSpent: followerGas,
              playerScore: score,
            }));
            break;
          } catch {
            // retry
          }
        }
      }

      if (signer?.address && readContractRef.current) {
        const score = await readContractRef.current.playerScore(signer.address);
        setState((prev) => ({ ...prev, playerScore: score }));
      }

      return { success: true, hash: tx.hash };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      let short = message;
      if (/insufficient funds/i.test(message)) {
        short = 'Insufficient MON — request testnet funds first';
      } else if (/user rejected|denied/i.test(message)) {
        short = 'Transaction rejected';
      } else if (message.length > 120) {
        short = message.slice(0, 117) + '...';
      }
      setState((prev) => ({ ...prev, lastError: short }));
      return { success: false, error: short };
    } finally {
      setState((prev) => ({ ...prev, pendingCell: null }));
    }
  }, [applyMoved, signer]);

  const startSimulation = useCallback(() => {
    if (simulationRef.current) return;

    setState((prev) => ({
      ...prev,
      simulationEnabled: true,
      simCells: prev.cells.map((cell) => ({ ...cell })),
      simMoveEvents: [...prev.moveEvents],
      simPioneerGasSpent: prev.pioneerGasSpent,
      simFollowerGasSpent: prev.followerGasSpent,
    }));

    simulationRef.current = setInterval(() => {
      const cellId = Math.floor(Math.random() * TOTAL_CELLS);
      const player = randomMockAddress();
      const gasUsed = randomMockGas();
      const isPioneer = Math.random() > 0.35;

      setState((prev) => {
        const cell = prev.simCells[cellId] ?? createInitialCells()[cellId];
        const willBePioneer = !cell.visited || isPioneer;
        const newVisitCount = cell.visitCount + 1;
        const nextCells = prev.simCells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                visited: true,
                pioneer: c.visited ? c.pioneer : player,
                visitCount: newVisitCount,
              }
            : c,
        );

        return {
          ...prev,
          simulationEnabled: true,
          simCells: nextCells,
          simPioneerGasSpent: willBePioneer ? prev.simPioneerGasSpent + gasUsed : prev.simPioneerGasSpent,
          simFollowerGasSpent: willBePioneer ? prev.simFollowerGasSpent : prev.simFollowerGasSpent + gasUsed,
          simMoveEvents: [
            {
              player,
              cellId,
              isPioneer: willBePioneer,
              visitCount: newVisitCount,
              gasUsed,
              timestamp: Date.now(),
            },
            ...prev.simMoveEvents,
          ].slice(0, 10),
        };
      });
    }, 800);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      simulationEnabled: false,
      simCells: prev.cells.map((cell) => ({ ...cell })),
      simMoveEvents: [...prev.moveEvents],
      simPioneerGasSpent: prev.pioneerGasSpent,
      simFollowerGasSpent: prev.followerGasSpent,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
    };
  }, []);

  return {
    cells: state.cells,
    moveEvents: state.moveEvents,
    pioneerGasSpent: state.pioneerGasSpent,
    followerGasSpent: state.followerGasSpent,
    playerScore: state.playerScore,
    simCells: state.simCells,
    simMoveEvents: state.simMoveEvents,
    simPioneerGasSpent: state.simPioneerGasSpent,
    simFollowerGasSpent: state.simFollowerGasSpent,
    connectionStatus: state.connectionStatus,
    pendingCell: state.pendingCell,
    lastError: state.lastError,
    contract: state.contract,
    move,
    startSimulation,
    stopSimulation,
  };
}
