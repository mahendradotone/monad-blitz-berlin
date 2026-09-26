import { useEffect, useState } from 'react';
import type { Contract } from 'ethers';
import type { CellState, MoveEvent } from '@/lib/contract';

export interface LeaderboardEntry {
  address: string;
  score: bigint;
  rank: number;
}

export function useLeaderboard(
  contract: Contract | null,
  cells: CellState[],
  moveEvents: MoveEvent[],
  currentAddress?: string | null,
) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!contract) {
      setLeaderboard([]);
      return;
    }

    const addresses = [...new Set(
      [
        ...moveEvents.map((event) => event.player),
        ...cells.filter((cell) => cell.visited && cell.pioneer).map((cell) => cell.pioneer),
      ]
        .filter(Boolean)
        .map((address) => address.toLowerCase()),
    )];

    if (addresses.length === 0) {
      setLeaderboard([]);
      return;
    }

    let cancelled = false;

    void Promise.all(
      addresses.map(async (address) => {
        const score = await contract.playerScore(address);
        return {
          address,
          score,
        };
      }),
    )
      .then((rows) => {
        if (cancelled) return;

        const sorted = [...rows]
          .filter((row) => row.score > 0n || row.address.toLowerCase() === currentAddress?.toLowerCase())
          .sort((a, b) => {
            if (a.score === b.score) return a.address.localeCompare(b.address);
            return a.score > b.score ? -1 : 1;
          })
          .slice(0, 8)
          .map((row, index) => ({
            ...row,
            rank: index + 1,
          }));

        setLeaderboard(sorted);
      })
      .catch(() => {
        if (!cancelled) setLeaderboard([]);
      });

    return () => {
      cancelled = true;
    };
  }, [cells, contract, currentAddress, moveEvents]);

  return leaderboard;
}
