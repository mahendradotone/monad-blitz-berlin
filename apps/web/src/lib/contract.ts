export const TRAILBLAZERS_ABI = [
  'function move(uint256 cellId) external',
  'function visited(uint256) view returns (bool)',
  'function pioneer(uint256) view returns (address)',
  'function visitCount(uint256) view returns (uint32)',
  'function playerScore(address) view returns (uint256)',
  'function totalPioneerGasSpent() view returns (uint256)',
  'function totalFollowerGasSpent() view returns (uint256)',
  'event Moved(address indexed player, uint256 indexed cellId, bool isPioneer, uint32 visitCount, uint256 gasUsed)',
] as const;

export const DEFAULT_CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

export const WS_URL = import.meta.env.VITE_WS_URL || '';
export const RPC_URL = import.meta.env.VITE_RPC_URL || '';

export const FAUCET_URL = 'https://agents.devnads.com/v1/faucet';

export const TOTAL_CELLS = 100;
export const GRID_SIZE = 10;

export interface CellState {
  id: number;
  visited: boolean;
  pioneer: string;
  visitCount: number;
}

export interface MoveEvent {
  player: string;
  cellId: number;
  isPioneer: boolean;
  visitCount: number;
  gasUsed: bigint;
  timestamp: number;
  txHash?: string;
}
