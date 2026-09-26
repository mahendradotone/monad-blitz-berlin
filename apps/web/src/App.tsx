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
      trailblazers.move(cellId);
    },
    [trailblazers],
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

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern bg-radial-glow text-white">
      <NavBar
        mode={mode}
        onModeChange={handleModeChange}
        connectionStatus={trailblazers.connectionStatus}
      />

      <main className="animate-fade-in">
        {mode === 'player' ? (
          <PlayerView
            wallet={wallet}
            cells={trailblazers.cells}
            pendingCell={trailblazers.pendingCell}
            moveEvents={trailblazers.moveEvents}
            onCellClick={handleCellClick}
          />
        ) : (
          <PresenterMode
            cells={trailblazers.cells}
            pendingCell={trailblazers.pendingCell}
            moveEvents={trailblazers.moveEvents}
            pioneerGasSpent={trailblazers.pioneerGasSpent}
            followerGasSpent={trailblazers.followerGasSpent}
            connectionStatus={trailblazers.connectionStatus}
            contractAddress={contractAddress}
            onContractAddressChange={setContractAddress}
            onCellClick={handleCellClick}
            simulationActive={simulationActive}
            onToggleSimulation={handleToggleSimulation}
          />
        )}
      </main>
    </div>
  );
}
