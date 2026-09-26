import { useEffect, useRef, useState } from 'react';
import { Snowflake, Loader2 } from 'lucide-react';
import type { CellState } from '@/lib/contract';
import { truncateAddress } from '@/lib/utils';

interface GridProps {
  cells: CellState[];
  pendingCell: number | null;
  onCellClick: (cellId: number) => void;
  pulseCellId: number | null;
  size?: 'mobile' | 'presenter';
}

function getCellBg(cell: CellState): string {
  if (!cell.visited) {
    return 'bg-slate-900/80 border-slate-700/80 text-slate-600';
  }

  const vc = cell.visitCount;
  if (vc <= 1) return 'bg-cyan-500/30 border-cyan-300/80 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.15)]';
  if (vc <= 3) return 'bg-violet-500/40 border-violet-300/80 shadow-[inset_0_0_0_1px_rgba(196,181,253,0.15)]';
  if (vc <= 6) return 'bg-fuchsia-500/45 border-fuchsia-300/80 shadow-[inset_0_0_0_1px_rgba(244,114,182,0.15)]';
  return 'bg-rose-500/55 border-rose-300/80 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.2)]';
}

export function Grid({
  cells,
  pendingCell,
  onCellClick,
  pulseCellId,
  size = 'mobile',
}: GridProps) {
  const isPresenter = size === 'presenter';

  return (
    <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
      {cells.map((cell) => (
        <Cell
          key={cell.id}
          cell={cell}
          isPending={pendingCell === cell.id}
          isPulsing={pulseCellId === cell.id}
          onClick={() => onCellClick(cell.id)}
          isPresenter={isPresenter}
        />
      ))}
    </div>
  );
}

interface CellProps {
  cell: CellState;
  isPending: boolean;
  isPulsing: boolean;
  onClick: () => void;
  isPresenter: boolean;
}

function Cell({ cell, isPending, isPulsing, onClick, isPresenter }: CellProps) {
  const [showPulse, setShowPulse] = useState(false);
  const prevVisit = useRef(cell.visitCount);

  useEffect(() => {
    if (cell.visitCount !== prevVisit.current) {
      prevVisit.current = cell.visitCount;
      setShowPulse(true);
      const t = setTimeout(() => setShowPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [cell.visitCount]);

  const bg = getCellBg(cell);
  const showPioneer = cell.visited && cell.visitCount <= 2 && cell.pioneer;

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      aria-label={cell.visited ? `Cell ${cell.id} visited ${cell.visitCount} times` : `Cell ${cell.id} unvisited`}
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-md border text-[7px] font-mono transition-all duration-300 sm:text-[9px] ${bg} ${
        isPending ? 'cursor-wait opacity-80' : 'cursor-pointer hover:scale-[1.04]'
      } ${showPulse || isPulsing ? 'animate-cell-pulse' : ''} ${isPresenter ? 'sm:rounded-lg' : ''}`}
    >
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-[1px]">
          <Loader2 className="h-3 w-3 animate-spin-slow text-white sm:h-4 sm:w-4" />
        </div>
      )}

      {!cell.visited && !isPending && (
        <Snowflake className="h-2.5 w-2.5 text-slate-500 opacity-60 sm:h-3 sm:w-3" />
      )}

      {showPioneer && !isPending && (
        <span
          className="absolute inset-x-0 bottom-0 truncate px-0.5 text-center text-[6px] text-white/80"
          title={cell.pioneer}
        >
          {truncateAddress(cell.pioneer)}
        </span>
      )}

      {cell.visited && cell.visitCount > 0 && !isPending && (
        <span
          className={`text-[7px] font-bold sm:text-[9px] ${
            cell.visitCount <= 1
              ? 'text-cyan-50'
              : cell.visitCount <= 5
                ? 'text-violet-50'
                : 'text-rose-50'
          }`}
        >
          {cell.visitCount}
        </span>
      )}
    </button>
  );
}
