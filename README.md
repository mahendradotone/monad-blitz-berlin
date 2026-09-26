# Monad Blitz Berlin — Trailblazers

Trailblazers is a live EVM gas-physics game built for Monad. The core mechanic turns the standard cold-vs-warm storage cost model into a visible 10x10 trail map: the first touch to a cell is expensive, later touches are cheaper, and the heatmap reflects the real accumulated on-chain state.

## Repository layout

- `apps/web` — React + Vite frontend for the Trailblazers board, burner wallet flow, and presenter/player experience
- `docs/reference` — reference mockup and design inspiration
- `apps/web/.env.example` — example environment config for RPC / WebSocket / contract address

## Quick start

```bash
cd /home/mahendra/monad-blitz-berlin
npm install --workspaces
npm run dev --workspace apps/web
```

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- ethers.js
- Monad-compatible EVM wallet and contract flow

## Demo narrative

The game highlights a real EVM behavior: cold storage access is more expensive than warm access. We turn that invisible cost model into a visible map where pioneers pay a premium to claim new territory and followers exploit the existing trail.

## Notes

This repository is meant to be public-facing and judged-friendly. Keep the project clean, explainable, and easy to re-deploy.
