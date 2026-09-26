# Trailblazers

Trailblazers — a live EVM gas-physics game on Monad.

The first time you touch a storage cell, it costs more. The second time is cheaper. Trailblazers turns that real cold-vs-warm storage cost model into a visible game board, where players race to claim new territory and exploit existing trails.

## Project pitch

Every EVM chain has a real storage-access cost model that is normally hidden in gas accounting. On Monad, with fast blocks and low fees, that mechanic becomes visible in real time.

Trailblazers makes the cost difference playable:

- pioneers pay a premium to claim fresh cells
- followers move cheaply along already-worn paths
- the heatmap darkens as the trail gets used
- the gas totals show the actual cost difference between cold and warm storage access

This is not a metaphor. It is a real EVM behavior made visible and game-like.

## Repo layout

- `apps/web` — React + Vite frontend for the player and presenter experience
- `docs/reference` — sample mockup and visual inspiration
- `LICENSE` — MIT license for public GitHub publishing

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- ethers.js
- Monad-compatible EVM wallet and contract flow

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

Fill in:

- `VITE_RPC_URL`
- `VITE_WS_URL`
- `VITE_CONTRACT_ADDRESS`

## Demo flow

- Open the app on a big screen in presenter mode.
- Invite players to tap cells from their phones.
- Watch the heatmap and gas totals update live.
- Explain that the cost difference on screen is real EVM storage behavior, not a visual effect.

## Notes

This project is built for a hackathon audience and is intentionally focused on a technically strong concept rather than production polish. It is designed to be easy to explain in a short pitch and easy to redeploy if the network or contract changes.

## License

MIT

## GitHub short description

Live EVM gas-physics demo on Monad: cold vs warm storage becomes a playable trail map.

## GitHub tag line

Cold storage is the premium path. Warm storage is the worn trail.
