import { getAddress, isConnected, requestAccess } from "@stellar/freighter-api";

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

export const walletSessionStorageKey = "bitstarter.walletSession";
export const walletSessionChangedEvent = "bitstarter:wallet-session-changed";

type BrowserWallets = typeof globalThis & {
  freighterApi?: FreighterApi;
  freighter?: FreighterApi;
  albedo?: {
    publicKey: (options?: { require_existing?: boolean }) => Promise<{ pubkey: string }>;
  };
};

type FreighterAddressResult = string | { address?: string; publicKey?: string; error?: string };
type FreighterConnectedResult = boolean | { isConnected?: boolean; error?: string };

type FreighterApi = {
  getPublicKey?: () => Promise<FreighterAddressResult>;
  getAddress?: () => Promise<FreighterAddressResult>;
  isConnected?: () => Promise<FreighterConnectedResult>;
  requestAccess?: () => Promise<FreighterAddressResult>;
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

function isWalletSession(value: unknown): value is WalletSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<WalletSession>;
  return (
    typeof session.publicKey === "string" &&
    session.publicKey.length > 0 &&
    session.connected === true &&
    typeof session.providerId === "string" &&
    typeof session.providerName === "string"
  );
}

export function readStoredWalletSession(): WalletSession | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.sessionStorage.getItem(walletSessionStorageKey);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isWalletSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredWalletSession(session: WalletSession) {
  window.sessionStorage.setItem(walletSessionStorageKey, JSON.stringify(session));
  window.dispatchEvent(new Event(walletSessionChangedEvent));
}

export function clearStoredWalletSession() {
  window.sessionStorage.removeItem(walletSessionStorageKey);
  window.dispatchEvent(new Event(walletSessionChangedEvent));
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function readFreighter(): FreighterApi | undefined {
  const wallets = globalThis as BrowserWallets;
  return wallets.freighterApi ?? wallets.freighter;
}

async function waitForFreighter(timeoutMilliseconds = 2000): Promise<FreighterApi | undefined> {
  const startedAt = Date.now();
  let freighter = readFreighter();

  while (!freighter && Date.now() - startedAt < timeoutMilliseconds) {
    await sleep(100);
    freighter = readFreighter();
  }

  return freighter;
}

function normalizeAddress(result: FreighterAddressResult): string {
  if (typeof result === "string") return result;
  if (result.error) throw new Error(result.error);
  return result.address ?? result.publicKey ?? "";
}

function normalizeConnected(result: FreighterConnectedResult): boolean {
  if (typeof result === "boolean") return result;
  if (result.error) throw new Error(result.error);
  return Boolean(result.isConnected);
}

async function connectFreighterWithPackage(): Promise<string> {
  const connected = normalizeConnected(await isConnected());
  if (!connected) {
    throw new Error("Freighter is installed, but not connected. Unlock Freighter and allow this site.");
  }

  const accessResult = await requestAccess();
  const accessAddress = normalizeAddress(accessResult);
  if (accessAddress) return accessAddress;

  return normalizeAddress(await getAddress());
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

  try {
    const publicKey = await connectFreighterWithPackage();
    return {
      publicKey,
      connected: true,
      providerId,
      providerName: provider.name
    };
  } catch {
    // Fall through to legacy injected globals for older Freighter builds.
  }

  const freighter = await waitForFreighter();

  if (!freighter) {
    throw new Error("Freighter is installed, but the page cannot access it. Enable the extension for localhost, unlock it, then refresh.");
  }

  let publicKey = "";

  if (freighter.requestAccess) {
    publicKey = normalizeAddress(await freighter.requestAccess());
  } else if (freighter.isConnected && normalizeConnected(await freighter.isConnected())) {
    const getAddress = freighter.getAddress ?? freighter.getPublicKey;
    publicKey = getAddress ? normalizeAddress(await getAddress()) : "";
  }

  if (!publicKey) {
    throw new Error("Freighter is available, but no account was shared. Unlock Freighter and approve access.");
  }

  return {
    publicKey,
    connected: true,
    providerId,
    providerName: provider.name
  };
}
