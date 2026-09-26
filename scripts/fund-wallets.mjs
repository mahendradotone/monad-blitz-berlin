import { ethers } from 'ethers';

const RPC_URL = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
const TEAM_PRIVATE_KEY = process.env.TEAM_PRIVATE_KEY;
const WALLET_ADDRESSES = (process.env.WALLET_ADDRESSES || '').split(',').filter(Boolean);
const AMOUNT_ETH = process.env.AMOUNT_ETH || '0.05';

if (!TEAM_PRIVATE_KEY) {
  throw new Error('TEAM_PRIVATE_KEY is required');
}
if (WALLET_ADDRESSES.length === 0) {
  throw new Error('WALLET_ADDRESSES must be a comma-separated list of addresses');
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(TEAM_PRIVATE_KEY, provider);

const amount = ethers.parseEther(AMOUNT_ETH);

for (const address of WALLET_ADDRESSES) {
  const tx = await signer.sendTransaction({
    to: address,
    value: amount,
  });
  console.log(`Sent ${AMOUNT_ETH} MON to ${address}: ${tx.hash}`);
  await tx.wait();
}
