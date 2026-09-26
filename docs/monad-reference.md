# Monad reference for Trailblazers

This file captures the key facts we rely on from the Monad docs and the local MONSKILLS package so the demo stays grounded in real EVM/Monad behavior.

## Core Monad facts

- Monad is EVM-compatible and built for high performance.
- Docs cite ~300ms block frequency and ~600ms finality.
- This makes a live, visible gas-physics demo feel immediate and legible to an audience.

## Gas model facts

Monad charges users based on the configured gas limit, not the gas actually used.

`gas_paid = gas_limit * price_per_gas`

This is a critical convention difference from Ethereum and directly affects UI decisions for gas estimates and user messaging.

## Cold vs warm storage access

From the local MONSKILLS gas skill:

- Cold storage access: 8,100 gas
- Warm storage access: 100 gas
- Cold account access: 10,100 gas
- Warm account access: 100 gas

This matches the heart of the game concept:

- first touch to a storage slot is expensive
- repeated access in the same transaction is cheap
- the app can visualize this as a trail or map mechanic

## Why this matters for the demo

The Trailblazers concept is not a metaphor. It is a real EVM cost model made visible.

The demo should frame the mechanic as:

- the board is a grid of storage slots
- the first player to touch a slot pays the cold-cost branch
- repeat players pay the warm-cost branch
- the heatmap visibly reflects the cumulative trail state

## Useful Monad concepts

From the MONSKILLS conceptual references:

- Async execution means there are block-state transitions and a delay before newly-funded accounts can send transactions reliably.
- Parallel execution and optimistic execution preserve Ethereum-equivalent semantics; no contract rewrite is required just because Monad is different.
- Block states are conceptually `latest`, `safe`, and `finalized`.

## Implementation guidance

When building the app:

- keep gas-limit messaging aligned with Monad semantics
- use explicit gas limits for known operations
- show the real storage-access cost difference as the core mechanic
- keep the demo fast and legible so the audience can understand the cold-vs-warm effect live

## Source

- Monad docs: https://docs.monad.xyz/
- Local MONSKILLS package: extracted from `/home/mahendra/Downloads/monskills-main.zip`
