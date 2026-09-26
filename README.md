# Trailblazers

Trailblazers — a live EVM gas-physics game on Monad.

The first time you touch a storage cell, it costs more. The second time is cheaper. Trailblazers turns the real cold-vs-warm storage cost model into a visible game board where players race to claim fresh territory and exploit existing trails.

## What this project does

- 10x10 board of storage cells
- each move is on-chain contract interaction
- first touch is the expensive cold-storage path
- repeat touch is the cheaper warm-storage path
- score and heatmap reflect the real accumulated state

## Repo layout

- `apps/web` — React + Vite frontend
- `contracts` — Solidity contract prototype for Monad testnet
- `scripts` — wallet funding helpers
- `docs` — Monad technical reference and context

## Stack

- React + Vite + TypeScript
- ethers.js
- Tailwind CSS
- Solidity
- Monad testnet

## Local setup

```bash
cd /home/mahendra/monad-blitz-berlin
npm install --workspaces
npm run dev --workspace apps/web
```

## Environment

```bash
cp apps/web/.env.example apps/web/.env
```

Example values:

```env
VITE_RPC_URL=https://testnet-rpc.monad.xyz
VITE_WS_URL=wss://testnet-rpc.monad.xyz/ws
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

## Wallet funding flow

This project uses a burner wallet pattern for audience devices:

- each player gets a random private key
- the browser stores it locally
- the team funds a small test MON amount to that wallet
- the wallet pays transaction gas on Monad testnet

Points are separate from wallet balance:

- wallet balance = test MON used to pay gas
- score = game points on screen / contract state

## Smart contract concept

```solidity
function move(uint256 cellId) external {
    if (!visited[cellId]) {
        visited[cellId] = true;
        pioneer[cellId] = msg.sender;
        visitCount[cellId] = 1;
        playerScore[msg.sender] += 25;
    } else {
        visitCount[cellId] += 1;
        playerScore[msg.sender] += 10;
    }
}
```

## Funding a demo wallet batch

```bash
export TEAM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
export MONAD_RPC_URL=https://testnet-rpc.monad.xyz
export WALLET_ADDRESSES=0xAAA,0xBBB,0xCCC
export AMOUNT_ETH=0.05
npm run fund-wallets
```

## License

MIT
