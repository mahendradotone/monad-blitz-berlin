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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-soft">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-[-0.03em] text-slate-900 sm:text-lg">
              Trailblazers
            </h1>
            <p className="hidden text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:block">
              Monad EVM Gas Game
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            onClick={() => onModeChange('player')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'player'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Player</span>
          </button>
          <button
            onClick={() => onModeChange('presenter')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'presenter'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Presenter</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status.color} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
          <span className="hidden text-xs font-medium text-slate-600 sm:inline">
            {status.label}
          </span>
        </div>
      </div>
    </header>
  );
}
