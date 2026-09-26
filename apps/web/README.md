# Trailblazers

Trailblazers is a Monad demo game that turns EVM cold vs warm storage access into a visible, playable grid.

## What it does

- A 10x10 board represents storage cells.
- Each move is a transaction to the smart contract.
- The first touch to a cell is the expensive cold-storage path.
- Repeat touches are cheaper warm-storage activity.
- The board heatmap and metrics track these real-world cost differences live.

## Local setup

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env` and fill in values for your RPC or WebSocket endpoint and contract address.
3. Run the app:
   npm run dev

## Demo flow

- Open the app on desktop in presenter mode for the big-screen view.
- Open the same app on mobile or another browser tab in player mode.
- Use burner wallets to submit moves and watch the heatmap shift as the board is claimed.
- Point to the gas totals to explain the real cold-vs-warm storage cost difference.

## Notes

This project is intentionally designed as a hackathon demo. The board and metrics prioritize clarity and explanation over production polish.
