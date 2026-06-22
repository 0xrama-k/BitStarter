export type StellarNetwork = "testnet";

export const stellarNetwork = {
  name: (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet") as StellarNetwork,
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org",
  factoryContractId: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ID ?? "",
  refundManagerContractId: process.env.NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID ?? "",
  preorderCampaignWasmHash: process.env.NEXT_PUBLIC_PREORDER_CAMPAIGN_WASM_HASH ?? "",
  networkPassphrase: "Test SDF Network ; September 2015"
};
