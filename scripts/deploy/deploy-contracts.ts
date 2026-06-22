import { execFileSync } from "node:child_process";

const network = process.env.STELLAR_NETWORK ?? "testnet";
const source = process.env.STELLAR_SOURCE ?? "bitstarter-deployer";

function stellar(args: string[]) {
  return execFileSync("stellar", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

stellar(["keys", "fund", source, "--network", network]);
execFileSync("cargo", ["build", "--workspace", "--target", "wasm32v1-none", "--release"], { stdio: "inherit" });

const factoryId = stellar(["contract", "deploy", "--wasm", "target/wasm32v1-none/release/campaign_factory.wasm", "--source", source, "--network", network]);
const refundId = stellar(["contract", "deploy", "--wasm", "target/wasm32v1-none/release/refund_manager.wasm", "--source", source, "--network", network]);

console.log({ factoryId, refundId });
