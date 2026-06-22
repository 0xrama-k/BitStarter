export type WalletProviderId = "freighter" | "albedo" | "demo";

export type WalletProvider = {
  id: WalletProviderId;
  name: string;
  description: string;
};

export type WalletSession = {
  publicKey: string;
  connected: boolean;
  providerId: WalletProviderId;
  providerName: string;
};

type BrowserWallets = typeof globalThis & {
  freighterApi?: {
    getPublicKey: () => Promise<string>;
    isConnected: () => Promise<boolean>;
    requestAccess?: () => Promise<string>;
  };
  albedo?: {
    publicKey: (options?: { require_existing?: boolean }) => Promise<{ pubkey: string }>;
  };
};

export const walletProviders: WalletProvider[] = [
  {
    id: "freighter",
    name: "Freighter",
    description: "Use the Freighter browser extension."
  },
  {
    id: "albedo",
    name: "Albedo",
    description: "Use Albedo's browser-based Stellar signing flow."
  },
  {
    id: "demo",
    name: "Demo account",
    description: "Use a read-only demo session for browsing the app."
  }
];

export const defaultWalletProviderId: WalletProviderId = "freighter";

export function getWalletProvider(providerId: WalletProviderId): WalletProvider {
  return walletProviders.find((provider) => provider.id === providerId) ?? walletProviders[0];
}

export async function connectWallet(providerId: WalletProviderId): Promise<WalletSession> {
  const provider = getWalletProvider(providerId);
  const wallets = globalThis as BrowserWallets;

  if (providerId === "demo") {
    return {
      publicKey: "GDEMO...WALLET",
      connected: true,
      providerId,
      providerName: provider.name
    };
  }

  if (providerId === "albedo") {
    if (!wallets.albedo) {
      throw new Error("Albedo is not available in this browser.");
    }

    const result = await wallets.albedo.publicKey();
    return {
      publicKey: result.pubkey,
      connected: true,
      providerId,
      providerName: provider.name
    };
  }

  const freighter = wallets.freighterApi;

  if (!freighter) {
    throw new Error("Freighter is not available in this browser.");
  }

  const publicKey = freighter.requestAccess
    ? await freighter.requestAccess()
    : (await freighter.isConnected())
      ? await freighter.getPublicKey()
      : "";

  if (!publicKey) {
    throw new Error("Freighter wallet is not connected.");
  }

  return {
    publicKey,
    connected: true,
    providerId,
    providerName: provider.name
  };
}
