import { useState, useCallback } from 'react';
import {
  Wallet,
  Copy,
  Check,
  Droplets,
  Loader2,
  ArrowUpRight,
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
  playerScore: bigint;
  pendingCell: number | null;
  moveEvents: MoveEvent[];
  onCellClick: (cellId: number) => void;
}

const PIONEER_POINTS = 25;
const FOLLOWER_POINTS = 10;

export function PlayerView({
  wallet,
  cells,
  playerScore,
  pendingCell,
  moveEvents,
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
  const myScore = Number(playerScore);
  const myClaimedCells = cells.filter(
    (cell) => cell.visited && cell.pioneer.toLowerCase() === wallet.address?.toLowerCase(),
  ).length;
  const visitedCount = cells.filter((c) => c.visited).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-[16px] border border-[#dccab8] bg-[#f7f1ea] p-4 shadow-[0_8px_20px_rgba(29,26,23,0.04)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#2d2724] text-[#f8f4ee] shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#6c625b]">Burner Wallet</p>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-medium text-[#1d1a17]">
                  {wallet.loading ? 'Generating...' : truncateAddress(wallet.address)}
                </span>
                {wallet.address && (
                  <button
                    onClick={handleCopy}
                    className="text-[#6c625b] transition-colors hover:text-[#1d1a17]"
                    aria-label="Copy wallet address"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6c625b]">Balance</p>
            <p className="font-sans text-lg font-bold text-[#1d1a17]">
              {formatMon(wallet.balance)} <span className="text-[10px] text-[#6c625b]">MON</span>
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-[#dccab8] bg-[#fffdf9] px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-[#6c625b]">
              <Trophy className="h-3.5 w-3.5 text-[#8d6d53]" />
              Score
            </div>
            <div className="mt-1 font-sans text-lg font-bold text-[#1d1a17]">{myScore}</div>
          </div>
          <div className="rounded-md border border-[#dccab8] bg-[#fffdf9] px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-[#6c625b]">
              <Flame className="h-3.5 w-3.5 text-[#b15f42]" />
              Pioneers
            </div>
            <div className="mt-1 font-sans text-lg font-bold text-[#1d1a17]">{myPioneers}</div>
          </div>
          <div className="rounded-md border border-[#dccab8] bg-[#fffdf9] px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-[#6c625b]">
              <Zap className="h-3.5 w-3.5 text-[#627d8a]" />
              Followers
            </div>
            <div className="mt-1 font-sans text-lg font-bold text-[#1d1a17]">{myFollowers}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-md border border-[#dccab8] bg-white px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-[#433d38]">
            <Route className="h-4 w-4 text-[#8d6d53]" />
            <span className="serif text-base font-semibold">Objective</span>
          </div>
          <span className="font-sans text-sm text-[#1d1a17]">{myClaimedCells} claimed cells</span>
        </div>

        <div className="mt-4">
          <button
            onClick={wallet.requestFaucet}
            disabled={wallet.faucetStatus === 'requesting' || !wallet.address}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#c89d7f] bg-[#2d2724] px-4 py-2.5 text-sm font-medium text-[#f8f4ee] transition-all hover:bg-[#1d1a17] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {wallet.faucetStatus === 'requesting' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Droplets className="h-4 w-4" />
            )}
            Request Testnet Funds
          </button>

          {wallet.faucetStatus === 'success' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {wallet.faucetMessage}
            </div>
          )}
          {wallet.faucetStatus === 'error' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {wallet.faucetMessage}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatChip icon={<Snowflake className="h-3.5 w-3.5" />} label="Unvisited" value={String(100 - visitedCount)} color="text-[#433d38]" />
        <StatChip icon={<Flame className="h-3.5 w-3.5" />} label="Pioneered" value={String(visitedCount)} color="text-[#433d38]" />
        <StatChip icon={<Zap className="h-3.5 w-3.5" />} label="My Moves" value={String(myMoves.length)} color="text-[#433d38]" />
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="serif text-[1.65rem] font-semibold text-[#1d1a17]">Game Board</h2>
          <span className="text-xs text-[#6c625b]">Tap a cell to move</span>
        </div>
        <div className="rounded-[14px] border border-[#dccab8] bg-[#f7f1ea] p-3 shadow-[0_8px_20px_rgba(29,26,23,0.04)] sm:p-4">
          <Grid
            cells={cells}
            pendingCell={pendingCell}
            onCellClick={onCellClick}
            pulseCellId={null}
            size="mobile"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 serif text-[1.5rem] font-semibold text-[#1d1a17]">My Recent Moves</h2>
        <div className="space-y-2">
          {myMoves.length === 0 ? (
            <div className="rounded-[14px] border border-[#dccab8] bg-white p-6 text-center text-sm text-[#6c625b] shadow-[0_8px_20px_rgba(29,26,23,0.04)]">
              You haven't made any moves yet. Tap a cell to start blazing a trail.
            </div>
          ) : (
            myMoves.slice(0, 5).map((move, i) => (
              <div
                key={`${move.timestamp}-${move.cellId}-${i}`}
                className="flex items-center justify-between rounded-md border border-[#dccab8] bg-white px-3 py-2.5 text-sm shadow-[0_8px_20px_rgba(29,26,23,0.04)]"
              >
                <div className="flex items-center gap-2">
                  {move.isPioneer ? (
                    <Flame className="h-4 w-4 text-[#b15f42]" />
                  ) : (
                    <Zap className="h-4 w-4 text-[#627d8a]" />
                  )}
                  <span className="font-sans text-[#1d1a17]">Cell {move.cellId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[#6c625b]">
                    {move.isPioneer ? 'Pioneer' : 'Follower'}
                  </span>
                  <span className="font-sans text-xs text-[#1d1a17]">{move.gasUsed.toString()}</span>
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
    <div className="rounded-md border border-[#dccab8] bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(29,26,23,0.04)]">
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-[0.12em] text-[#6c625b]">{label}</span>
      </div>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
