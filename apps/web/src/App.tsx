import { useCallback, useEffect, useState } from 'react';
import { NavBar, type ViewMode } from '@/components/NavBar';
import { PlayerView } from '@/components/PlayerView';
import { PresenterMode } from '@/components/PresenterMode';
import { useBurnerWallet } from '@/hooks/useBurnerWallet';
import { useTrailblazersContract } from '@/hooks/useTrailblazersContract';
import { DEFAULT_CONTRACT_ADDRESS } from '@/lib/contract';

const MODE_KEY = 'trailblazers_view_mode';

function getInitialMode(): ViewMode {
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === 'player' || saved === 'presenter') return saved;
  return 'player';
}

export default function App() {
  const [mode, setMode] = useState<ViewMode>(getInitialMode);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [simulationActive, setSimulationActive] = useState(false);

  const wallet = useBurnerWallet();
  const trailblazers = useTrailblazersContract(
    wallet.signer,
    wallet.provider,
    contractAddress,
  );

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const handleModeChange = useCallback((m: ViewMode) => {
    setMode(m);
  }, []);

  const handleCellClick = useCallback(
    (cellId: number) => {
      void trailblazers.move(cellId).then((result) => {
        if (result?.success && wallet.provider && wallet.signer) {
          void wallet.refreshBalance();
        }
      });
    },
    [trailblazers, wallet],
  );

  const handleToggleSimulation = useCallback(() => {
    if (simulationActive) {
      trailblazers.stopSimulation();
      setSimulationActive(false);
    } else {
      trailblazers.startSimulation();
      setSimulationActive(true);
    }
  }, [simulationActive, trailblazers]);

  const displayedCells = simulationActive ? trailblazers.simCells : trailblazers.cells;
  const displayedMoves = simulationActive ? trailblazers.simMoveEvents : trailblazers.moveEvents;

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-stone-900">
      <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-5">
        <div className="overflow-hidden rounded-[18px] border border-[#d9cfc3] bg-[#f9f6f1]/95 shadow-[0_12px_32px_rgba(29,26,23,0.05)] backdrop-blur-sm">
          <NavBar
            mode={mode}
            onModeChange={handleModeChange}
            connectionStatus={trailblazers.connectionStatus}
          />

          <main className="animate-fade-in px-2 pb-2 sm:px-4">
            {mode === 'player' ? (
              <PlayerView
                wallet={wallet}
                cells={displayedCells}
                playerScore={trailblazers.playerScore}
                pendingCell={trailblazers.pendingCell}
                moveEvents={displayedMoves}
                onCellClick={handleCellClick}
              />
            ) : (
              <PresenterMode
                cells={displayedCells}
                pendingCell={trailblazers.pendingCell}
                moveEvents={displayedMoves}
                pioneerGasSpent={simulationActive ? trailblazers.simPioneerGasSpent : trailblazers.pioneerGasSpent}
                followerGasSpent={simulationActive ? trailblazers.simFollowerGasSpent : trailblazers.followerGasSpent}
                connectionStatus={trailblazers.connectionStatus}
                contractAddress={contractAddress}
                onContractAddressChange={setContractAddress}
                onCellClick={handleCellClick}
                simulationActive={simulationActive}
                onToggleSimulation={handleToggleSimulation}
                currentAddress={wallet.signer?.address ?? null}
                contract={trailblazers.contract}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
