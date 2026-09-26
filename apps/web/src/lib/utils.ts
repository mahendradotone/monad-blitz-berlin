export function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatGas(wei: bigint): string {
  const gwei = Number(wei) / 1e9;
  if (gwei >= 1_000_000) {
    return `${(gwei / 1_000_000).toFixed(2)}M gwei`;
  }
  if (gwei >= 1_000) {
    return `${(gwei / 1_000).toFixed(2)}K gwei`;
  }
  return `${gwei.toFixed(2)} gwei`;
}

export function formatMon(wei: bigint): string {
  const eth = Number(wei) / 1e18;
  if (eth === 0) return '0';
  if (eth < 0.001) return '<0.001';
  return eth.toFixed(4);
}

export function shortHash(hash: string): string {
  if (!hash || hash.length < 12) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

const RANDOM_ADDRESSES = [
  '0x4F1a2b3c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a',
  '0x7C9d1E2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d',
  '0x3B5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e',
  '0x9A1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b',
  '0x5E4d3C2b1A0f9E8d7C6b5A4f3E2d1C0b9A8f7E6d',
  '0x2D3c4B5a6F7e8D9c0B1a2F3e4D5c6B7a8F9e0D1c',
  '0x8F7e6D5c4B3a2F1e0D9c8B7a6F5e4D3c2B1a0F9e',
  '0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b',
  '0x6F5e4D3c2B1a0F9e8D7c6B5a4F3e2D1c0B9a8F7e',
  '0x0D1c2B3a4F5e6D7c8B9a0F1e2D3c4B5a6F7e8D9c',
];

export function randomMockAddress(): string {
  return RANDOM_ADDRESSES[Math.floor(Math.random() * RANDOM_ADDRESSES.length)];
}

export function randomMockGas(): bigint {
  const baseGwei = 21000 + Math.floor(Math.random() * 80000);
  return BigInt(Math.floor(baseGwei * 1e9));
}
