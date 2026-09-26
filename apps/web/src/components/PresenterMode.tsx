import { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Zap,
  TrendingUp,
  Activity,
  Radio,
  Settings2,
  Trophy,
} from 'lucide-react';
import { Grid } from '@/components/Grid';
import type { CellState, MoveEvent } from '@/lib/contract';
import { truncateAddress, formatGas } from '@/lib/utils';
import type { ConnectionStatus } from '@/hooks/useTrailblazersContract';

interface PresenterModeProps {
  cells: CellState[];
  pendingCell: number | null;
  moveEvents: MoveEvent[];
  pioneerGasSpent: bigint;
  followerGasSpent: bigint;
  connectionStatus: ConnectionStatus;
  contractAddress: string;
  onContractAddressChange: (addr: string) => void;
  onCellClick: (cellId: number) => void;
  simulationActive: boolean;
  onToggleSimulation: () => void;
}

const GOAL_CELLS = 25;

export function PresenterMode({
  cells,
  pendingCell,
  moveEvents,
  pioneerGasSpent,
  followerGasSpent,
  connectionStatus,
  contractAddress,
  onContractAddressChange,
  onCellClick,
  simulationActive,
  onToggleSimulation,
}: PresenterModeProps) {
  const [pulseCellId, setPulseCellId] = useState<number | null>(null);
  const lastEventRef = useRef<number>(0);

  useEffect(() => {
    if (moveEvents.length > 0 && moveEvents[0].timestamp !== lastEventRef.current) {
      lastEventRef.current = moveEvents[0].timestamp;
      setPulseCellId(moveEvents[0].cellId);
      const t = setTimeout(() => setPulseCellId(null), 600);
      return () => clearTimeout(t);
    }
  }, [moveEvents]);

  const totalGas = pioneerGasSpent + followerGasSpent;
  const coldToWarmRatio = pioneerGasSpent > 0n && followerGasSpent > 0n
    ? Number(pioneerGasSpent) / Number(followerGasSpent)
    : 0;
  const claimedCells = cells.filter((cell) => cell.visited).length;
  const goalProgress = Math.min((claimedCells / GOAL_CELLS) * 100, 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          icon={<Flame className="h-6 w-6" />}
          label="Pioneer Gas (Cold)"
          value={formatGas(pioneerGasSpent)}
          accentColor="slate"
          gradient="from-stone-50 to-white"
          border="border-stone-200"
          subtitle="First storage touch"
        />

        <div className="flex flex-col items-center justify-center rounded-[16px] border border-stone-200 bg-white p-5 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
          <div className="flex items-center gap-2 text-stone-600">
            <TrendingUp className="h-5 w-5" />
            <span className="text-[10px] font-medium uppercase tracking-[0.16em]">Storage Cost Ratio</span>
          </div>
          <p className="mt-2 text-4xl font-bold tracking-[-0.05em] text-stone-900">
            {coldToWarmRatio > 0 ? `${coldToWarmRatio.toFixed(2)}x` : '—'}
          </p>
          <p className="mt-1 text-xs text-stone-500">Cold storage cost vs warm reuse</p>
        </div>

        <StatCard
          icon={<Zap className="h-6 w-6" />}
          label="Follower Gas (Warm)"
          value={formatGas(followerGasSpent)}
          accentColor="slate"
          gradient="from-stone-50 to-white"
          border="border-stone-200"
          subtitle="Repeated storage touch"
        />
      </div>

      <div className="mb-6 rounded-[16px] border border-stone-200 bg-white p-4 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-800">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold">Win condition</span>
          </div>
          <span className="font-mono text-xs text-stone-700">{claimedCells}/{GOAL_CELLS} cells</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-stone-700 via-sky-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">
          First player to claim {GOAL_CELLS} cells wins the round. Cold paths are costly, warm trails are efficient.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[16px] border border-stone-200 bg-white p-5 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
              <Activity className="h-5 w-5 text-stone-700" />
              Trail Heatmap
            </h2>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-stone-500">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Pioneer
              <span className="ml-1 h-2 w-2 rounded-full bg-stone-400" /> Trail
            </div>
          </div>
          <Grid
            cells={cells}
            pendingCell={pendingCell}
            onCellClick={onCellClick}
            pulseCellId={pulseCellId}
            size="presenter"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[16px] border border-stone-200 bg-white p-4 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
            <div className="mb-3 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-stone-700" />
              <h3 className="text-sm font-semibold text-stone-800">Controls</h3>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio
                  className={`h-4 w-4 ${simulationActive ? 'text-sky-600 animate-pulse' : 'text-stone-500'}`}
                />
                <span className="text-sm text-stone-700">Simulate Live Game</span>
              </div>
              <button
                onClick={onToggleSimulation}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  simulationActive ? 'bg-stone-900' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    simulationActive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-stone-500">
                Contract Address
              </label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => onContractAddressChange(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-800 outline-none transition-colors focus:border-stone-400"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === 'live'
                    ? 'bg-emerald-500'
                    : connectionStatus === 'http'
                      ? 'bg-amber-500'
                      : connectionStatus === 'connecting'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-stone-400'
                }`}
              />
              <span className="text-stone-600">
                {connectionStatus === 'live'
                  ? 'WebSocket Live'
                  : connectionStatus === 'http'
                    ? 'HTTP Fallback'
                    : connectionStatus === 'connecting'
                      ? 'Connecting...'
                      : 'Offline — Demo mode'}
              </span>
            </div>
          </div>

          <div className="flex-1 rounded-[16px] border border-stone-200 bg-white p-4 shadow-[0_8px_20px_rgba(24,24,27,0.04)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
              <Activity className="h-4 w-4 text-stone-700" />
              Live Event Ticker
            </h3>
            <div className="space-y-2">
              {moveEvents.length === 0 ? (
                <div className="py-8 text-center text-sm text-stone-500">Waiting for moves...</div>
              ) : (
                moveEvents.map((evt, i) => (
                  <div
                    key={`${evt.timestamp}-${evt.cellId}-${i}`}
                    className={`animate-ticker-in flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs ${
                      evt.isPioneer
                        ? 'border-stone-200 bg-stone-50'
                        : 'border-stone-200 bg-white'
                    } ${i === 0 ? 'ring-1 ring-stone-200' : ''}`}
                  >
                    {evt.isPioneer ? (
                      <Flame className="h-3.5 w-3.5 shrink-0 text-stone-700" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 shrink-0 text-stone-700" />
                    )}
                    <span className="shrink-0 font-mono text-stone-700">{truncateAddress(evt.player)}</span>
                    <span className="text-stone-500">→</span>
                    <span className="shrink-0 font-semibold text-stone-900">Cell {evt.cellId}</span>
                    <span className="ml-auto shrink-0 font-mono text-stone-700">{formatGas(evt.gasUsed)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-500">
        <span>Total gas spent:</span>
        <span className="font-mono font-bold text-stone-900">{formatGas(totalGas)}</span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accentColor,
  gradient,
  border,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: 'slate';
  gradient: string;
  border: string;
  subtitle: string;
}) {
  const accentClass = 'text-stone-800';

  return (
    <div className={`rounded-[16px] border bg-gradient-to-br ${gradient} ${border} p-5 shadow-[0_8px_20px_rgba(24,24,27,0.04)]`}>
      <div className={`flex items-center gap-3 ${accentClass}`}>
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{subtitle}</p>
    </div>
  );
}
