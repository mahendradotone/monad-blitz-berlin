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
    <header className="sticky top-0 z-50 border-b border-[#dbcab9] bg-[#f9f6f1]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-[#2d2724] text-[#f8f4ee] shadow-sm">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="display-serif text-base font-bold tracking-[-0.04em] text-[#1d1a17] sm:text-[1.7rem]">
              Trailblazers
            </h1>
            <p className="hidden text-[10px] uppercase tracking-[0.12em] text-[#6c625b] sm:block">
              Monad EVM Gas Game
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-[#dcc9b9] bg-[#f0e7de] p-1">
          <button
            onClick={() => onModeChange('player')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'player'
                ? 'bg-[#2d2724] text-[#f8f4ee] shadow-sm'
                : 'text-[#5d5650] hover:text-[#1d1a17]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Player</span>
          </button>
          <button
            onClick={() => onModeChange('presenter')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'presenter'
                ? 'bg-[#2d2724] text-[#f8f4ee] shadow-sm'
                : 'text-[#5d5650] hover:text-[#1d1a17]'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Presenter</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${status.color} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
          <span className="hidden text-xs font-medium text-[#5d5650] sm:inline">
            {status.label}
          </span>
        </div>
      </div>
    </header>
  );
}
