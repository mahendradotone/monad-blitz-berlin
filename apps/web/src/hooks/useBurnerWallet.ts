import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers, WebSocketProvider, JsonRpcProvider } from 'ethers';

const STORAGE_KEY = 'trailblazers_burner_key';

type Provider = WebSocketProvider | JsonRpcProvider;

interface BurnerWalletState {
  address: string;
  balance: bigint;
  loading: boolean;
  faucetStatus: 'idle' | 'requesting' | 'success' | 'error';
  faucetMessage: string;
  provider: Provider | null;
  signer: ethers.Wallet | null;
}

function getProvider(): Provider | null {
  const wsUrl = import.meta.env.VITE_WS_URL || '';
  const rpcUrl = import.meta.env.VITE_RPC_URL || '';

  if (wsUrl && wsUrl.startsWith('ws')) {
    try {
      return new WebSocketProvider(wsUrl);
    } catch {
      // fall through to rpc
    }
  }
  if (rpcUrl) {
    try {
      return new JsonRpcProvider(rpcUrl);
    } catch {
      return null;
    }
  }
  return null;
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

      const provider = getProvider();
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
      const resp = await fetch('https://agents.devnads.com/v1/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chainId: 10143, 
          address: state.signer.address 
        }),
      });

      if (!resp.ok) {
        throw new Error(`Faucet returned ${resp.status}`);
      }

      const data = await resp.json().catch(() => ({}));
      setState((prev) => ({
        ...prev,
        faucetStatus: 'success',
        faucetMessage: `Sent ${Number(data.amount) / 1e18} MON via ${data.txHash.slice(0, 10)}...`,
      }));

      setTimeout(() => refreshBalance(), 3000);
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
  }, [state.signer, refreshBalance, state.address]);

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
