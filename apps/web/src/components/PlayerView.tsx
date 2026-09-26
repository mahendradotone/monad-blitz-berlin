import { useState, useCallback } from 'react';
import {
  Wallet,
  Copy,
  Check,
  Droplets,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Snowflake,
  Flame,
  Zap,
  Route,
  Trophy,
} from 'lucide-react';
import type { useBurnerWallet } from '@/hooks/useBurnerWallet';
import { Grid } from '@/components/Grid';
import type { CellState, MoveEvent } from '@/lib/contract';
import { truncateAddress, formatMon } from '@/lib/utils';

interface PlayerViewProps {
  wallet: ReturnType<typeof useBurnerWallet>;
  cells: CellState[];
  pendingCell: number | null;
  moveEvents: MoveEvent[];
  lastError?: string | null;
  onCellClick: (cellId: number) => void;
}

const PIONEER_POINTS = 25;
const FOLLOWER_POINTS = 10;

export function PlayerView({
  wallet,
  cells,
  pendingCell,
  moveEvents,
  lastError = null,
  onCellClick,
}: PlayerViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!wallet.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [wallet.address]);

  const myMoves = moveEvents.filter(
    (e) => wallet.address && e.player.toLowerCase() === wallet.address.toLowerCase(),
  );

  const myPioneers = myMoves.filter((move) => move.isPioneer).length;
  const myFollowers = myMoves.filter((move) => !move.isPioneer).length;
  const myScore = myMoves.reduce(
    (sum, move) => sum + (move.isPioneer ? PIONEER_POINTS : FOLLOWER_POINTS),
    0,
  );
  const myClaimedCells = cells.filter(
    (cell) => cell.visited && cell.pioneer.toLowerCase() === wallet.address?.toLowerCase(),
  ).length;
  const visitedCount = cells.filter((c) => c.visited).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-2xl border border-violet-500/30 bg-slate-900/80 p-4 shadow-[0_0_24px_rgba(139,92,246,0.12)] backdrop-blur-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Burner Wallet</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-white">
                  {wallet.loading ? 'Generating...' : truncateAddress(wallet.address)}
                </span>
                {wallet.address && (
                  <button
                    onClick={handleCopy}
                    className="text-slate-400 transition-colors hover:text-cyan-300"
                    aria-label="Copy wallet address"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-cyan-300" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Balance</p>
            <p className="font-mono text-lg font-bold text-cyan-300">
              {formatMon(wallet.balance)} <span className="text-[10px] text-slate-400">MON</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Trophy className="h-3.5 w-3.5 text-violet-300" />
              Score
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-violet-300">{myScore}</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Flame className="h-3.5 w-3.5 text-rose-300" />
              Pioneers
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-rose-300">{myPioneers}</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Zap className="h-3.5 w-3.5 text-cyan-300" />
              Followers
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-cyan-300">{myFollowers}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Route className="h-4 w-4 text-violet-300" />
            <span>Objective</span>
          </div>
          <span className="font-mono text-sm text-cyan-300">{myClaimedCells} claimed cells</span>
        </div>

        <div className="mt-4">
          <button
            onClick={wallet.requestFaucet}
            disabled={wallet.faucetStatus === 'requesting' || !wallet.address}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-all hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {wallet.faucetStatus === 'requesting' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Droplets className="h-4 w-4" />
            )}
            Request Testnet Funds
          </button>

          {wallet.faucetStatus === 'success' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {wallet.faucetMessage}
            </div>
          )}
          {wallet.faucetStatus === 'error' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-300">
              <AlertCircle className="h-3.5 w-3.5" />
              {wallet.faucetMessage}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatChip icon={<Snowflake className="h-3.5 w-3.5" />} label="Unvisited" value={String(100 - visitedCount)} color="text-slate-300" />
        <StatChip icon={<Flame className="h-3.5 w-3.5" />} label="Pioneered" value={String(visitedCount)} color="text-rose-300" />
        <StatChip icon={<Zap className="h-3.5 w-3.5" />} label="My Moves" value={String(myMoves.length)} color="text-cyan-300" />
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Game Board</h2>
          <span className="text-xs text-slate-400">Tap a cell to move</span>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3 sm:p-4">
          <Grid
            cells={cells}
            pendingCell={pendingCell}
            onCellClick={onCellClick}
            pulseCellId={null}
            size="mobile"
          />
        </div>
        {lastError && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {lastError}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">My Recent Moves</h2>
        <div className="space-y-2">
          {myMoves.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
              You haven't made any moves yet. Tap a cell to start blazing a trail.
            </div>
          ) : (
            myMoves.slice(0, 5).map((move, i) => (
              <div
                key={`${move.timestamp}-${move.cellId}-${i}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  {move.isPioneer ? (
                    <Flame className="h-4 w-4 text-rose-300" />
                  ) : (
                    <Zap className="h-4 w-4 text-cyan-300" />
                  )}
                  <span className="font-mono text-slate-300">Cell {move.cellId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {move.isPioneer ? 'Pioneer' : 'Follower'}
                  </span>
                  <span className="font-mono text-xs text-violet-300">{move.gasUsed.toString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</span>
      </div>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
