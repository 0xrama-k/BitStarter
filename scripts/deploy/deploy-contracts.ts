import { execFileSync } from "node:child_process";

const network = process.env.STELLAR_NETWORK ?? "testnet";
const source = process.env.STELLAR_SOURCE ?? "bitstarter-deployer";
const networkPassphrase =
  process.env.STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

function stellar(args: string[]) {
  return execFileSync("stellar", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

function extractContractId(output: string) {
  const match = output.match(/C[A-Z2-7]{55}/);
  if (!match) throw new Error(`Could not find contract ID in Stellar output: ${output}`);
  return match[0];
}

function extractWasmHash(output: string) {
  const match = output.match(/[a-f0-9]{64}/i);
  if (!match) throw new Error(`Could not find WASM hash in Stellar output: ${output}`);
  return match[0];
}

stellar(["keys", "fund", source, "--network", network]);
execFileSync("cargo", ["build", "--workspace", "--target", "wasm32v1-none", "--release"], { stdio: "inherit" });

const factoryId = extractContractId(stellar(["contract", "deploy", "--wasm", "target/wasm32v1-none/release/campaign_factory.wasm", "--source", source, "--network", network]));
const escrowId = extractContractId(stellar(["contract", "deploy", "--wasm", "target/wasm32v1-none/release/escrow.wasm", "--source", source, "--network", network]));
const investmentCampaignWasmHash = extractWasmHash(stellar(["-q", "contract", "upload", "--wasm", "target/wasm32v1-none/release/investment_campaign.wasm", "--source", source, "--network", network]));
const refundId = extractContractId(stellar(["contract", "deploy", "--wasm", "target/wasm32v1-none/release/refund_manager.wasm", "--source", source, "--network", network]));
const admin = stellar(["keys", "address", source]);
const nativeXlmTokenId = process.env.XLM_TOKEN_CONTRACT_ID ?? execFileSync(
  "node",
  [
    "-e",
    "const { Asset } = require('./apps/web/node_modules/@stellar/stellar-sdk'); console.log(Asset.native().contractId(process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015'))"
  ],
  {
    encoding: "utf8",
    env: { ...process.env, STELLAR_NETWORK_PASSPHRASE: networkPassphrase }
  }
).trim();

stellar([
  "contract",
  "invoke",
  "--id",
  escrowId,
  "--source",
  source,
  "--network",
  network,
  "--",
  "initialize",
  "--admin",
  admin,
  "--token",
  nativeXlmTokenId
]);

stellar([
  "contract",
  "invoke",
  "--id",
  factoryId,
  "--source",
  source,
  "--network",
  network,
  "--",
  "initialize",
  "--admin",
  admin,
  "--campaign_wasm_hash",
  investmentCampaignWasmHash,
  "--token",
  nativeXlmTokenId,
  "--escrow",
  escrowId
]);

console.log({ factoryId, escrowId, investmentCampaignWasmHash, refundId, nativeXlmTokenId });
