"use client";

import { Check, ChevronDown, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import {
  connectWallet,
  defaultWalletProviderId,
  getWalletProvider,
  walletProviders,
  type WalletProviderId,
  type WalletSession
} from "@/lib/stellar/wallet";

const providerStorageKey = "bitstarter.walletProvider";

export function WalletStatus() {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [providerId, setProviderId] = useState<WalletProviderId>(() => {
    if (typeof window === "undefined") return defaultWalletProviderId;
    return (window.localStorage.getItem(providerStorageKey) as WalletProviderId | null) ?? defaultWalletProviderId;
  });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect(nextProviderId = providerId) {
    setLoading(true);
    setError("");
    try {
      const nextSession = await connectWallet(nextProviderId);
      setSession(nextSession);
      setProviderId(nextProviderId);
      window.localStorage.setItem(providerStorageKey, nextProviderId);
      setOpen(false);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectProvider(nextProviderId: WalletProviderId) {
    setProviderId(nextProviderId);
    window.localStorage.setItem(providerStorageKey, nextProviderId);
    setSession(null);
    setError("");
  }

  function handleDisconnect() {
    setSession(null);
    setError("");
    setOpen(false);
  }

  const provider = getWalletProvider(providerId);
  const buttonText = session?.connected
    ? `${session.publicKey.slice(0, 6)}...${session.publicKey.slice(-4)}`
    : loading
      ? "Connecting..."
      : provider.name;

  return (
    <div className="relative">
      <div className="flex overflow-hidden rounded-md border border-line bg-white">
        <button
          type="button"
          onClick={() => session?.connected ? setOpen((current) => !current) : handleConnect()}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 px-3 text-sm disabled:opacity-60"
          title={session?.connected ? "Wallet connected" : `Connect ${provider.name}`}
        >
          <Wallet size={16} aria-hidden="true" />
          <span>{buttonText}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex min-h-10 w-9 items-center justify-center border-l border-line"
          title="Choose wallet provider"
          aria-label="Choose wallet provider"
        >
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-line bg-white p-2 text-sm shadow-lg">
          <div className="px-2 py-2 text-xs font-semibold uppercase text-slate-500">Wallet provider</div>
          <div className="space-y-1">
            {walletProviders.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectProvider(option.id)}
                className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-panel"
              >
                <span className="mt-0.5 flex h-4 w-4 items-center justify-center">
                  {providerId === option.id ? <Check size={16} className="text-accent" aria-hidden="true" /> : null}
                </span>
                <span>
                  <span className="block font-medium">{option.name}</span>
                  <span className="block text-xs leading-5 text-slate-500">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => handleConnect()}
              disabled={loading}
              className="w-full rounded-md bg-ink px-3 py-2 text-left text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Connecting..." : `Connect ${provider.name}`}
            </button>
            {session?.connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="mt-2 inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
              >
                <LogOut size={15} aria-hidden="true" />
                Disconnect
              </button>
            ) : null}
          </div>
          {error ? <p role="alert" className="mt-2 rounded-md bg-rose-50 p-2 text-xs text-rose-700">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
