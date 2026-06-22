import { signTransaction } from "@stellar/freighter-api";
import { rpc, TransactionBuilder } from "@stellar/stellar-sdk";
import { stellarNetwork } from "./network";

export type TransactionResult = {
  hash: string;
  status: string;
};

export async function signAndSubmitTransaction(
  server: rpc.Server,
  transactionXdr: string,
  signerAddress: string
): Promise<TransactionResult> {
  const signed = await signTransaction(transactionXdr, {
    address: signerAddress,
    networkPassphrase: stellarNetwork.networkPassphrase
  });

  if (signed.error) {
    throw new Error(signed.error.message ?? "Transaction signing failed.");
  }

  const transaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    stellarNetwork.networkPassphrase
  );
  const sent = await server.sendTransaction(transaction);

  if (sent.status === "ERROR") {
    throw new Error(sent.errorResult?.toString() ?? "Transaction submission failed.");
  }

  return waitForTransaction(server, sent.hash);
}

export async function waitForTransaction(
  server: rpc.Server,
  hash: string
): Promise<TransactionResult> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await server.getTransaction(hash);
    if (response.status === "SUCCESS") {
      return { hash, status: response.status };
    }
    if (response.status === "FAILED" || response.status === "NOT_FOUND") {
      throw new Error(`Transaction ${response.status.toLowerCase()}: ${hash}`);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  }

  return { hash, status: "PENDING" };
}
