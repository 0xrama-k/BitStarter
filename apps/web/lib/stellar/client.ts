import { rpc } from "@stellar/stellar-sdk";
import { stellarNetwork } from "./network";

export function createRpcClient() {
  return new rpc.Server(stellarNetwork.rpcUrl);
}
