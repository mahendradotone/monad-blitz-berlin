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
  pioneerGasSpent: bigint;
  followerGasSpent: bigint;
  moveEvents: MoveEvent[];
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useTrailblazersContract(
  signer: ethers.Wallet | null,
  provider: Provider | null,
  contractAddress: string = DEFAULT_CONTRACT_ADDRESS,
) {
  const [state, setState] = useState<TrailblazersState>({
    cells: createInitialCells(),
    pioneerGasSpent: 0n,
    followerGasSpent: 0n,
    moveEvents: [],
    connectionStatus: 'connecting',
    pendingCell: null,
    lastError: null,
    contract: null,
    contractAddress,
  });

  const contractRef = useRef<Contract | null>(null);
  const readContractRef = useRef<Contract | null>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenEventKeys = useRef<Set<string>>(new Set());
  const lastPolledBlock = useRef<number>(0);

  const applyMoved = useCallback(
    (
      player: string,
      cellId: number,
      isPioneer: boolean,
      visitCount: number,
      gasUsed: bigint,
      txHash?: string,
    ) => {
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
        pioneerGasSpent: isPioneer
          ? prev.pioneerGasSpent + gasUsed
          : prev.pioneerGasSpent,
        followerGasSpent: isPioneer
          ? prev.followerGasSpent
          : prev.followerGasSpent + gasUsed,
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
      // Merge so a move completed during load is not overwritten by a stale snapshot
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
  }, []);

  // Connect to contract when provider/signer is available
  useEffect(() => {
    if (!provider || !signer) {
      if (!provider) {
        setState((prev) => ({ ...prev, connectionStatus: 'offline' }));
      }
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    async function setup() {
      const httpContract = new ethers.Contract(
        contractAddress,
        TRAILBLAZERS_ABI,
        provider,
      );
      const writeContract = new ethers.Contract(
        contractAddress,
        TRAILBLAZERS_ABI,
        signer,
      );

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

      // Monad WS log subscriptions are currently unreliable (HTTP 500 / 429),
      // so we intentionally avoid them and rely on the HTTP polling path.
      await startHttpPolling(httpContract, provider!);
    }

    setup();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (contractRef.current) {
        try {
          contractRef.current.removeAllListeners();
        } catch {
          // ignore
        }
      }
    };
  }, [provider, signer, contractAddress, loadInitialState, applyMoved]);

  const move = useCallback(async (cellId: number) => {
    if (!contractRef.current) return;
    setState((prev) => ({ ...prev, pendingCell: cellId, lastError: null }));
    try {
      const tx = await contractRef.current.move(cellId, { gasLimit: MOVE_GAS_LIMIT });
      const receipt = await tx.wait();
      const txHash = receipt?.hash ?? tx.hash;

      // Prefer parsing Moved from the receipt so UI updates without extra RPC
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
              applyMoved(
                player,
                cellId,
                Boolean(isPioneer),
                Number(visitCount),
                BigInt(gasUsed),
                txHash,
              );
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
            applyMoved(
              pio || (signer?.address ?? ''),
              cellId,
              visitCount === 1,
              visitCount,
              0n,
              txHash,
            );
            const [pioneerGas, followerGas] = await Promise.all([
              read.totalPioneerGasSpent(),
              read.totalFollowerGasSpent(),
            ]);
            setState((prev) => ({
              ...prev,
              pioneerGasSpent: pioneerGas,
              followerGasSpent: followerGas,
            }));
            break;
          } catch {
            // retry
          }
        }
      }

      return { success: true, hash: tx.hash };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      // Prefer a short user-facing reason
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
  }, [applyMoved, signer?.address]);

  const startSimulation = useCallback(() => {
    if (simulationRef.current) return;
    simulationRef.current = setInterval(() => {
      const cellId = Math.floor(Math.random() * TOTAL_CELLS);
      const player = randomMockAddress();
      const gasUsed = randomMockGas();
      const isPioneer = Math.random() > 0.35;

      setState((prev) => {
        const cell = prev.cells[cellId];
        const willBePioneer = !cell.visited || isPioneer;
        const newVisitCount = cell.visitCount + 1;

        return {
          ...prev,
          cells: prev.cells.map((c) =>
            c.id === cellId
              ? {
                  ...c,
                  visited: true,
                  pioneer: c.visited ? c.pioneer : player,
                  visitCount: newVisitCount,
                }
              : c,
          ),
          pioneerGasSpent: willBePioneer
            ? prev.pioneerGasSpent + gasUsed
            : prev.pioneerGasSpent,
          followerGasSpent: willBePioneer
            ? prev.followerGasSpent
            : prev.followerGasSpent + gasUsed,
          moveEvents: [
            {
              player,
              cellId,
              isPioneer: willBePioneer,
              visitCount: newVisitCount,
              gasUsed,
              timestamp: Date.now(),
            },
            ...prev.moveEvents,
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
  }, []);

  useEffect(() => {
    return () => stopSimulation();
  }, [stopSimulation]);

  return {
    cells: state.cells,
    pioneerGasSpent: state.pioneerGasSpent,
    followerGasSpent: state.followerGasSpent,
    moveEvents: state.moveEvents,
    connectionStatus: state.connectionStatus,
    pendingCell: state.pendingCell,
    lastError: state.lastError,
    move,
    startSimulation,
    stopSimulation,
  };
}
