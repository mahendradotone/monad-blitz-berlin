import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers, JsonRpcProvider } from 'ethers';

const STORAGE_KEY = 'trailblazers_burner_key';
const FAUCET_URL = 'https://agents.devnads.com/v1/faucet';

interface BurnerWalletState {
  address: string;
  balance: bigint;
  loading: boolean;
  faucetStatus: 'idle' | 'requesting' | 'success' | 'error';
  faucetMessage: string;
  provider: JsonRpcProvider | null;
  signer: ethers.Wallet | null;
}

function getHttpProvider(): JsonRpcProvider | null {
  const rpcUrl = import.meta.env.VITE_RPC_URL || '';
  if (!rpcUrl) return null;
  try {
    return new JsonRpcProvider(rpcUrl);
  } catch {
    return null;
  }
}

function getInitialKey(): string | null {
  const params = new URLSearchParams(window.location.search);
  const queryKey = params.get('key');
  if (queryKey && queryKey.startsWith('0x') && queryKey.length === 66) {
    return queryKey;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export function useBurnerWallet() {
  const [state, setState] = useState<BurnerWalletState>({
    address: '',
    balance: 0n,
    loading: true,
    faucetStatus: 'idle',
    faucetMessage: '',
    provider: null,
    signer: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let privateKey = getInitialKey();

      if (!privateKey) {
        const wallet = ethers.Wallet.createRandom();
        privateKey = wallet.privateKey;
        localStorage.setItem(STORAGE_KEY, privateKey);
      }

      // Always use HTTP for the signer — Monad WS RPC fails writes.
      const provider = getHttpProvider();
      let wallet: ethers.Wallet;

      if (provider) {
        wallet = new ethers.Wallet(privateKey, provider);
      } else {
        wallet = new ethers.Wallet(privateKey);
      }

      if (cancelled) return;

      setState((prev) => ({
        ...prev,
        address: wallet.address,
        signer: wallet,
        provider,
        loading: false,
      }));

      if (provider) {
        try {
          const balance = await provider.getBalance(wallet.address);
          if (!cancelled) {
            setState((prev) => ({ ...prev, balance }));
          }
        } catch {
          // offline — balance stays 0
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const refreshBalance = useCallback(async () => {
    const { provider, signer } = stateRef.current;
    if (!provider || !signer) return;
    try {
      const balance = await provider.getBalance(signer.address);
      setState((prev) => ({ ...prev, balance }));
    } catch {
      // ignore
    }
  }, []);

  const requestFaucet = useCallback(async () => {
    if (!state.signer) return;
    setState((prev) => ({
      ...prev,
      faucetStatus: 'requesting',
      faucetMessage: '',
    }));

    try {
      const resp = await fetch(FAUCET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId: 10143,
          address: state.signer.address,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Faucet returned ${resp.status}`);
      }

      const data = await resp.json().catch(() => ({} as { amount?: string; txHash?: string }));
      const provider = stateRef.current.provider;

      if (data.txHash && provider) {
        try {
          await provider.waitForTransaction(data.txHash, 1, 90_000);
        } catch {
          // Fall through to balance poll
        }
      }

      // Confirm funds landed (tx wait can miss; poll briefly)
      let funded = false;
      if (provider && state.signer) {
        for (let i = 0; i < 15; i++) {
          const balance = await provider.getBalance(state.signer.address);
          if (balance > 0n) {
            setState((prev) => ({
              ...prev,
              balance,
              faucetStatus: 'success',
              faucetMessage: data.txHash
                ? `Sent ${Number(data.amount ?? 0) / 1e18} MON via ${String(data.txHash).slice(0, 10)}...`
                : 'Testnet funds received',
            }));
            funded = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (!funded) {
        throw new Error('Faucet tx submitted but funds not received yet — try again shortly');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Faucet request failed';
      setState((prev) => ({
        ...prev,
        faucetStatus: 'error',
        faucetMessage: msg,
      }));
    }

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        faucetStatus: 'idle',
        faucetMessage: '',
      }));
    }, 5000);
  }, [state.signer]);

  return {
    address: state.address,
    balance: state.balance,
    loading: state.loading,
    signer: state.signer,
    provider: state.provider,
    faucetStatus: state.faucetStatus,
    faucetMessage: state.faucetMessage,
    requestFaucet,
    refreshBalance,
  };
}
