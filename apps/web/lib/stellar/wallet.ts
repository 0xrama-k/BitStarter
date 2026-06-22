export type WalletSession = {
  publicKey: string;
  connected: boolean;
};

export async function connectWallet(): Promise<WalletSession> {
  const freighter = (globalThis as typeof globalThis & {
    freighterApi?: { getPublicKey: () => Promise<string>; isConnected: () => Promise<boolean> };
  }).freighterApi;

  if (!freighter) {
    return { publicKey: "GDEMO...WALLET", connected: false };
  }

  const connected = await freighter.isConnected();
  const publicKey = connected ? await freighter.getPublicKey() : "";
  return { publicKey, connected };
}
