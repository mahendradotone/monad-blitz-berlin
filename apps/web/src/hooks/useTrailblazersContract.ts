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

interface TrailblazersState {
  cells: CellState[];
  pioneerGasSpent: bigint;
  followerGasSpent: bigint;
  moveEvents: MoveEvent[];
  connectionStatus: ConnectionStatus;
  pendingCell: number | null;
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
    contract: null,
    contractAddress,
  });

  const contractRef = useRef<Contract | null>(null);
  const providerRef = useRef<Provider | null>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateCell = useCallback((cellId: number, updates: Partial<CellState>) => {
    setState((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => (c.id === cellId ? { ...c, ...updates } : c)),
    }));
  }, []);

  const addMoveEvent = useCallback((event: MoveEvent) => {
    setState((prev) => ({
      ...prev,
      moveEvents: [event, ...prev.moveEvents].slice(0, 10),
    }));
  }, []);

  const loadInitialState = useCallback(
    async (contract: Contract) => {
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

        const cellPromises = Array.from({ length: TOTAL_CELLS }, async (_, i) => {
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
        });
        const cells = await Promise.all(cellPromises);
        setState((prev) => ({ ...prev, cells }));
      } catch {
        // offline — keep defaults
      }
    },
    [],
  );

  // Connect to contract when provider/signer is available
  useEffect(() => {
    if (!provider || !signer) {
      if (!provider) {
        setState((prev) => ({ ...prev, connectionStatus: 'offline' }));
      }
      return;
    }

    let cancelled = false;
    providerRef.current = provider;

    async function setup() {
      const activeProvider = provider!;
      const readOnlyContract = new ethers.Contract(
        contractAddress,
        TRAILBLAZERS_ABI,
        activeProvider,
      );
      const writeContract = new ethers.Contract(
        contractAddress,
        TRAILBLAZERS_ABI,
        signer,
      );

      contractRef.current = writeContract;

      if (cancelled) return;

      const isWs = 'websocket' in activeProvider && (activeProvider as { websocket?: unknown }).websocket != null;
      setState((prev) => ({
        ...prev,
        contract: writeContract,
        connectionStatus: isWs ? 'live' : 'http',
      }));

      await loadInitialState(readOnlyContract);

      // Listen for Moved events
      const filter = readOnlyContract.filters.Moved();
      readOnlyContract.on(filter, (player, cellId, isPioneer, visitCount, gasUsed, event) => {
        if (cancelled) return;
        const cellIdNum = Number(cellId);
        const vcNum = Number(visitCount);

        updateCell(cellIdNum, {
          visited: true,
          pioneer: player,
          visitCount: vcNum,
        });

        setState((prev) => ({
          ...prev,
          pioneerGasSpent: isPioneer
            ? prev.pioneerGasSpent + gasUsed
            : prev.pioneerGasSpent,
          followerGasSpent: isPioneer
            ? prev.followerGasSpent
            : prev.followerGasSpent + gasUsed,
        }));

        addMoveEvent({
          player,
          cellId: cellIdNum,
          isPioneer,
          visitCount: vcNum,
          gasUsed,
          timestamp: Date.now(),
          txHash: event?.log?.transactionHash,
        });
      });

      readOnlyContract.on('error', () => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, connectionStatus: 'http' }));
        }
      });
    }

    setup();

    return () => {
      cancelled = true;
      if (contractRef.current) {
        contractRef.current.removeAllListeners();
      }
    };
  }, [provider, signer, contractAddress, loadInitialState, updateCell, addMoveEvent]);

  // Move function
  const move = useCallback(
    async (cellId: number) => {
      if (!contractRef.current) return;
      setState((prev) => ({ ...prev, pendingCell: cellId }));
      try {
        const tx = await contractRef.current.move(cellId);
        await tx.wait();
        return { success: true, hash: tx.hash };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Transaction failed',
        };
      } finally {
        setState((prev) => ({ ...prev, pendingCell: null }));
      }
    },
    [],
  );

  // Simulation mode
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
    move,
    startSimulation,
    stopSimulation,
  };
}
