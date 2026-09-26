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
    return 'bg-stone-100 border-stone-200 text-stone-400';
  }

  const vc = cell.visitCount;
  if (vc <= 1) return 'bg-sky-100 border-sky-300';
  if (vc <= 3) return 'bg-slate-100 border-slate-300';
  if (vc <= 6) return 'bg-stone-200 border-stone-400';
  return 'bg-stone-300 border-stone-500';
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
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[6px] border text-[7px] font-mono transition-all duration-300 sm:text-[9px] ${bg} ${
        isPending ? 'cursor-wait opacity-80' : 'cursor-pointer hover:scale-[1.02]'
      } ${showPulse || isPulsing ? 'animate-cell-pulse' : ''} ${isPresenter ? 'sm:rounded-[7px]' : ''}`}
    >
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-950/70 backdrop-blur-[1px]">
          <Loader2 className="h-3 w-3 animate-spin-slow text-white sm:h-4 sm:w-4" />
        </div>
      )}

      {!cell.visited && !isPending && (
        <Snowflake className="h-2.5 w-2.5 text-stone-400 opacity-60 sm:h-3 sm:w-3" />
      )}

      {showPioneer && !isPending && (
        <span
          className="absolute inset-x-0 bottom-0 truncate px-0.5 text-center text-[6px] text-stone-700"
          title={cell.pioneer}
        >
          {truncateAddress(cell.pioneer)}
        </span>
      )}

      {cell.visited && cell.visitCount > 0 && !isPending && (
        <span
          className={`text-[7px] font-bold sm:text-[9px] ${
            cell.visitCount <= 1
              ? 'text-sky-700'
              : cell.visitCount <= 5
                ? 'text-stone-700'
                : 'text-stone-900'
          }`}
        >
          {cell.visitCount}
        </span>
      )}
    </button>
  );
}
