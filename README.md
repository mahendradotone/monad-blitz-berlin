# Trailblazers

Trailblazers is a live Monad gas-game demo that turns cold-versus-warm storage costs into a playable board. Players race to claim fresh cells, while repeated touches become cheaper and more efficient.

The project combines a React + Vite frontend with a Solidity contract deployed to the Monad testnet, using real on-chain state and a burner-wallet flow for live demo play.

## What it does

- 10x10 grid of storage cells
- each move is an on-chain transaction
- first touch = expensive cold-storage path
- repeat touch = cheaper warm-storage path
- scoring and heatmap reflect the real contract state
- presenter mode surfaces gas ratios and live activity

## Live demo

Production app:

- https://monad-blitz-berlin-web.vercel.app

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS
- ethers.js
- Solidity
- Monad testnet

## Repository layout

- `apps/web` — front-end app
- `contracts` — smart contract source
- `scripts` — wallet funding and deployment utilities
- `docs` — Monad references and supporting notes

## Prerequisites

- Node.js 18+
- npm
- a funded wallet for Monad testnet if you want to deploy or fund burner wallets

## Local development

From the project root:

```bash
npm install
npm run dev --workspace apps/web
```

The app runs at the default Vite address:

- http://localhost:5173

## Environment setup

Create the app environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Example values:

```env
VITE_RPC_URL=https://testnet-rpc.monad.xyz
VITE_WS_URL=wss://testnet-rpc.monad.xyz/ws
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

## Demo wallet flow

The app uses a burner-wallet pattern for quick live demos:

- each player gets a random private key
- the browser stores it locally
- a team wallet funds the account with test MON
- the funded wallet pays gas for each move

Important distinction:

- wallet balance = MON used to pay gas
- score = in-game points on the board / on-chain state

## Contract overview

The game logic rewards first-time discoveries more than repeated visits, matching the underlying cold-versus-warm storage economics.

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

## Funding demo wallets

```bash
export TEAM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
export MONAD_RPC_URL=https://testnet-rpc.monad.xyz
export WALLET_ADDRESSES=0xAAA,0xBBB,0xCCC
export AMOUNT_ETH=0.05
npm run fund-wallets
```

## Scripts

```bash
npm run dev --workspace apps/web
npm run build --workspace apps/web
npm run typecheck --workspace apps/web
npm run fund-wallets
npm run deploy:testnet
```

## License

MIT
