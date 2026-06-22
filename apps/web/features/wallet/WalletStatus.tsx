"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";
import { connectWallet, type WalletSession } from "@/lib/stellar/wallet";

export function WalletStatus() {
  const [session, setSession] = useState<WalletSession | null>(null);

  async function handleConnect() {
    setSession(await connectWallet());
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm"
      title="Connect Stellar Testnet wallet"
    >
      <Wallet size={16} aria-hidden="true" />
      {session?.publicKey ? `${session.publicKey.slice(0, 6)}...${session.publicKey.slice(-4)}` : "Connect"}
    </button>
  );
}
