# Trailblazers

Trailblazers is a live EVM gas-physics game built for Monad. It turns the invisible cold-vs-warm storage cost model into a visible, player-driven board: the first time a cell is touched, it costs more; later touches are cheaper, and the heatmap reflects the real accumulated on-chain state.

## Why this project

The idea is simple but technically sharp:

- EVM storage access is not cost-neutral.
- Cold storage access is more expensive than warm access.
- Monad’s speed makes this cost difference visible in real time.
- Trailblazers makes that mechanic a playable map instead of backend trivia.

The result is a fast, social demo where pioneers pay a premium to claim new territory while followers exploit existing trails at lower cost.

## Repo layout

- `apps/web` — React + Vite frontend for the player/presenter experience
- `docs/reference` — design reference and static mockup inspiration
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

Then open the app in a browser and switch between player mode and presenter mode.

## Environment

Copy the example env file inside the app before connecting to a real RPC or contract:

```bash
cp apps/web/.env.example apps/web/.env
```

Set values for:

- `VITE_RPC_URL`
- `VITE_WS_URL`
- `VITE_CONTRACT_ADDRESS`

## Demo flow

- Open the app on a large display in presenter mode.
- Invite players to tap cells on their phones.
- Watch the heatmap, gas totals, and event feed update live.
- Explain that the color and cost difference is a real EVM storage cost effect made visible by the gameplay loop.

## Notes

This is intentionally a hackathon-style demo focused on a strong technical concept over production polish. It is designed to be easy to explain in a three-minute pitch and easy to redeploy if the contract or network changes.

## License

MIT
