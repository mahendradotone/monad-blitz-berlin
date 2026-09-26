# Trailblazers: Monad Blitz Berlin

Trailblazers: Monad Blitz Berlin is a live on-chain gas-game demo built for the Monad testnet. Players claim cells on a 10x10 board, where the first touch is expensive and repeated touches become cheaper. The game turns cold-versus-warm storage economics into an interactive, competitive board.

This repo contains the full project: a React + Vite frontend, Solidity smart contract logic, burner-wallet demo flow, and live presenter tooling for showcasing the game in a judge or event setting.

## Live demo

Production app:
- https://trailblazers-monad.vercel.app

Legacy alias:
- https://monad-blitz-berlin-web.vercel.app

## What is in the game

- 10x10 board of cells
- on-chain move transactions
- cold storage on first claim = expensive pioneer move
- warm storage on repeat touches = cheaper follow-up move
- real leaderboard by on-chain `playerScore(address)`
- presenter dashboard with board coverage, gas totals, and live event ticker
- burner-wallet flow for instant demo play on Monad testnet

## Game loop

- each move calls the smart contract
- if a cell is unclaimed, the player becomes the pioneer
- repeated visits to the same cell are cheaper and contribute to the warm-storage pattern
- board coverage and player rank are tracked from live contract state
- the presenter view shows who is leading and how much of the map is claimed

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS
- ethers.js
- Solidity
- Monad testnet
- Vercel for production hosting

## Repository layout

- `apps/web` — frontend application
- `contracts` — Solidity contract source
- `scripts` — wallet funding and deployment helpers
- `docs` — supporting references and notes

## Current project status

This project is live and demo-ready with:

- a real game board and contract-backed play loop
- live Monad testnet integration
- multi-player score tracking from the contract
- a corrected board-coverage banner instead of a misleading per-player win claim
- a leaderboard for presenter/demo use

## Purpose & Significance

Trailblazers is intentionally simple: it strips away wallet UX, token mechanics, and complicated game rules to make one EVM truth visible — cold vs warm storage cost — and make it easy for anyone to understand and explore.

- **Why this matters:** cold/warm storage cost is a fundamental EVM property that shapes real-world contract design, gas optimizations, and long-term user experience. By surfacing this invisible cost as a live visual and numeric comparison, Trailblazers makes an abstract systems-level tradeoff immediately understandable to non-experts and experts alike.
- **Educational value:** instructors and engineers can use the app to teach why storage writes are expensive, how re-use reduces cost, and how architecting for warm-paths can reduce gas in production contracts.
- **Research & experimentation:** the app provides a repeatable, observable environment for benchmarking gas patterns, testing heuristics for storage reuse, and demonstrating the effect of storage access patterns under real chain conditions.

## Potential Uses

- Demo & outreach: a short, memorable demo in a talk or booth that makes gas mechanics feel tangible.
- Prototyping: experiment with alternative scoring or reward mechanisms that encourage reuse, to study economic incentives in contract design.
- Teaching: use the board in classroom settings to let students run experiments and immediately see gas consequences.
- Benchmarking: pair Trailblazers with automated scripts to measure cold/warm ratios under different move distributions and network conditions.

These sections are intentionally concise — they explain the premise and concrete ways the project can be reused, extended, and applied.

## Prerequisites

- Node.js 18+
- npm
- a funded Monad testnet wallet if you want to deploy or fund burner accounts

## Local development

From the project root:

```bash
npm install
npm run dev --workspace apps/web
```

The app runs on the default Vite port:

- http://localhost:5173

## Environment setup

Create the app environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Example:

```env
VITE_RPC_URL=https://testnet-rpc.monad.xyz
VITE_WS_URL=wss://testnet-rpc.monad.xyz/ws
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

## Demo wallet flow

The app uses a burner-wallet model for quick live demos:

- each player gets a random private key
- the browser stores the local key
- a team wallet funds test MON to the burner account
- the demo wallet pays gas for each move

This keeps live testing fast and avoids requiring each player to sign in with a permanent wallet.

## Contract overview

The game logic rewards first-time discoveries and tracks repeated touches, matching the cold-versus-warm storage economics of the underlying system.

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

## Useful scripts

```bash
npm run dev --workspace apps/web
npm run build --workspace apps/web
npm run typecheck --workspace apps/web
npm run fund-wallets
npm run deploy:testnet
```

## License

MIT
