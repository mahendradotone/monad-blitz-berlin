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
          gradient="from-[#f7efe7] to-white"
          border="border-[#dccab8]"
          subtitle="First storage touch"
        />

        <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#dccab8] bg-white p-5 shadow-[0_8px_20px_rgba(29,26,23,0.04)]">
          <div className="flex items-center gap-2 text-[#5d5650]">
            <TrendingUp className="h-5 w-5 text-[#8d6d53]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.16em]">Storage Cost Ratio</span>
          </div>
          <p className="mt-2 text-4xl font-bold tracking-[-0.05em] text-[#1d1a17] serif">
            {coldToWarmRatio > 0 ? `${coldToWarmRatio.toFixed(2)}x` : '—'}
          </p>
          <p className="mt-1 text-xs text-[#6c625b]">Cold storage cost vs warm reuse</p>
        </div>

        <StatCard
          icon={<Zap className="h-6 w-6" />}
          label="Follower Gas (Warm)"
          value={formatGas(followerGasSpent)}
          accentColor="slate"
          gradient="from-[#eef3f5] to-white"
          border="border-[#d3dfe6]"
          subtitle="Repeated storage touch"
        />
      </div>

      <div className="mb-6 rounded-[16px] border border-[#dccab8] bg-white p-4 shadow-[0_8px_20px_rgba(29,26,23,0.04)]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1d1a17]">
            <Trophy className="h-4 w-4 text-[#8d6d53]" />
            <span className="serif text-[1.5rem] font-semibold">Win condition</span>
          </div>
          <span className="font-sans text-xs text-[#1d1a17]">{claimedCells}/{GOAL_CELLS} cells</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#e7ddd2]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8d6d53] via-[#728aa0] to-[#6d8d78] transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#6c625b]">
          First player to claim {GOAL_CELLS} cells wins the round. Cold paths are costly, warm trails are efficient.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[16px] border border-[#dccab8] bg-white p-5 shadow-[0_8px_20px_rgba(29,26,23,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1d1a17]">
              <Activity className="h-5 w-5 text-[#8d6d53]" />
              <span className="serif text-[2rem]">Trail Heatmap</span>
            </h2>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#6c625b]">
              <span className="h-2 w-2 rounded-full bg-[#7c9bb3]" /> Pioneer
              <span className="ml-1 h-2 w-2 rounded-full bg-[#a89d93]" /> Trail
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
          <div className="rounded-[16px] border border-[#dccab8] bg-white p-4 shadow-[0_8px_20px_rgba(29,26,23,0.04)]">
            <div className="mb-3 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#8d6d53]" />
              <h3 className="serif text-[1.5rem] font-semibold text-[#1d1a17]">Controls</h3>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio
                  className={`h-4 w-4 ${simulationActive ? 'text-sky-600 animate-pulse' : 'text-[#6c625b]'}`}
                />
                <span className="text-sm text-[#433d38]">Simulate Live Game</span>
              </div>
              <button
                onClick={onToggleSimulation}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  simulationActive ? 'bg-[#2d2724]' : 'bg-[#d7cabd]'
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
              <label className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-[#6c625b]">
                Contract Address
              </label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => onContractAddressChange(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-md border border-[#dccab8] bg-[#f7f1ea] px-3 py-2 font-sans text-xs text-[#1d1a17] outline-none transition-colors focus:border-[#bca089]"
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
                        : 'bg-[#b7a79a]'
                }`}
              />
              <span className="text-[#5d5650]">
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

          <div className="flex-1 rounded-[16px] border border-[#dccab8] bg-white p-4 shadow-[0_8px_20px_rgba(29,26,23,0.04)]">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1d1a17]">
              <Activity className="h-4 w-4 text-[#8d6d53]" />
              <span className="serif text-[1.5rem]">Live Event Ticker</span>
            </h3>
            <div className="space-y-2">
              {moveEvents.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#6c625b]">Waiting for moves...</div>
              ) : (
                moveEvents.map((evt, i) => (
                  <div
                    key={`${evt.timestamp}-${evt.cellId}-${i}`}
                    className={`animate-ticker-in flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs ${
                      evt.isPioneer
                        ? 'border-[#dccab8] bg-[#f7f1ea]'
                        : 'border-[#dccab8] bg-white'
                    } ${i === 0 ? 'ring-1 ring-[#dccab8]' : ''}`}
                  >
                    {evt.isPioneer ? (
                      <Flame className="h-3.5 w-3.5 shrink-0 text-[#b15f42]" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 shrink-0 text-[#627d8a]" />
                    )}
                    <span className="shrink-0 font-sans text-[#1d1a17]">{truncateAddress(evt.player)}</span>
                    <span className="text-[#6c625b]">→</span>
                    <span className="shrink-0 font-semibold text-[#1d1a17]">Cell {evt.cellId}</span>
                    <span className="ml-auto shrink-0 font-sans text-[#1d1a17]">{formatGas(evt.gasUsed)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#6c625b]">
        <span>Total gas spent:</span>
        <span className="font-sans font-bold text-[#1d1a17]">{formatGas(totalGas)}</span>
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
  const accentClass = 'text-[#1d1a17]';

  return (
    <div className={`rounded-[16px] border bg-gradient-to-br ${gradient} ${border} p-5 shadow-[0_8px_20px_rgba(29,26,23,0.04)]`}>
      <div className={`flex items-center gap-3 ${accentClass}`}>
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[#1d1a17] serif">{value}</p>
      <p className="mt-1 text-xs text-[#6c625b]">{subtitle}</p>
    </div>
  );
}
