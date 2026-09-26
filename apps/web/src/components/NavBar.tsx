import { Compass, Smartphone, Monitor } from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/useTrailblazersContract';

export type ViewMode = 'player' | 'presenter';

interface NavBarProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  connectionStatus: ConnectionStatus;
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
  connecting: { color: 'bg-amber-400', label: 'Connecting' },
  live: { color: 'bg-emerald-500', label: 'Live' },
  http: { color: 'bg-amber-500', label: 'HTTP Fallback' },
  offline: { color: 'bg-slate-400', label: 'Offline' },
};

export function NavBar({ mode, onModeChange, connectionStatus }: NavBarProps) {
  const status = statusConfig[connectionStatus];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#f8f6f2]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-stone-900 text-white shadow-sm">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-[-0.03em] text-stone-900 sm:text-lg">
              Trailblazers
            </h1>
            <p className="hidden text-[10px] uppercase tracking-[0.12em] text-stone-500 sm:block">
              Monad EVM Gas Game
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-stone-200 bg-stone-100 p-1">
          <button
            onClick={() => onModeChange('player')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'player'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Player</span>
          </button>
          <button
            onClick={() => onModeChange('presenter')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'presenter'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Presenter</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status.color} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
          <span className="hidden text-xs font-medium text-stone-600 sm:inline">
            {status.label}
          </span>
        </div>
      </div>
    </header>
  );
}
