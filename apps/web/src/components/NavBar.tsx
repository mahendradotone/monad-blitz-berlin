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
  live: { color: 'bg-lightning-400', label: 'Live (WS)' },
  http: { color: 'bg-amber-400', label: 'HTTP Fallback' },
  offline: { color: 'bg-flame-500', label: 'Offline' },
};

export function NavBar({ mode, onModeChange, connectionStatus }: NavBarProps) {
  const status = statusConfig[connectionStatus];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-monad-500 to-monad-800 glow-border">
            <Compass className="h-5 w-5 text-monad-50" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-monad-50 sm:text-lg">
              Trailblazers
            </h1>
            <p className="hidden text-[10px] text-monad-300/60 sm:block">
              Monad EVM Gas Game
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-850 p-1">
          <button
            onClick={() => onModeChange('player')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'player'
                ? 'bg-monad-600 text-monad-50 shadow-lg shadow-monad-600/30'
                : 'text-slate-400 hover:text-monad-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Player</span>
          </button>
          <button
            onClick={() => onModeChange('presenter')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              mode === 'presenter'
                ? 'bg-monad-600 text-monad-50 shadow-lg shadow-monad-600/30'
                : 'text-slate-400 hover:text-monad-200'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Presenter</span>
          </button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${status.color} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
          <span className="hidden text-xs font-medium text-slate-400 sm:inline">
            {status.label}
          </span>
        </div>
      </div>
    </header>
  );
}
