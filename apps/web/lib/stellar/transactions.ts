import { signTransaction } from "@stellar/freighter-api";
import {
  Address,
  rpc,
  scValToNative,
  Transaction,
  TransactionBuilder,
  xdr
} from "@stellar/stellar-sdk";
import { stellarNetwork } from "./network";

export type TransactionResult = {
  hash: string;
  status: string;
  returnValue?: unknown;
};

// Soroban's simulation returns a separate authorization entry for every
// `require_auth()` in the invocation tree — including the ones that fire deep
// inside cross-contract calls. For invest/withdraw the actual token movement
// happens in `escrow.deposit()` / `escrow.release()` -> `token.transfer()`,
// several calls below the contract method the user invokes, so those nested
// entries come back with "address" credentials that must be authorized
// independently of the transaction envelope.
//
// Freighter's `signTransaction` only signs the envelope, never these embedded
// auth entries, so the nested transfers stayed unauthorized: the transaction
// was submitted but no XLM ever moved. Because the investor/developer who signs
// is always the transaction source account, we rewrite their entries to use
// source-account credentials, which the envelope signature does authorize.
function authorizeEntriesWithSourceAccount(
  transactionXdr: string,
  signerAddress: string
): string {
  const envelope = xdr.TransactionEnvelope.fromXDR(transactionXdr, "base64");
  if (envelope.switch() !== xdr.EnvelopeType.envelopeTypeTx()) {
    return transactionXdr;
  }

  const operation = envelope.v1().tx().operations()[0];
  if (!operation || operation.body().switch() !== xdr.OperationType.invokeHostFunction()) {
    return transactionXdr;
  }

  const hostFunctionOp = operation.body().invokeHostFunctionOp();
  const signerScAddress = Address.fromString(signerAddress).toScAddress().toXDR("base64");

  let rewroteEntry = false;
  const authorized = hostFunctionOp.auth().map((entry) => {
    const credentials = entry.credentials();
    if (credentials.switch() !== xdr.SorobanCredentialsType.sorobanCredentialsAddress()) {
      return entry;
    }
    if (credentials.address().address().toXDR("base64") !== signerScAddress) {
      return entry;
    }
    rewroteEntry = true;
    return new xdr.SorobanAuthorizationEntry({
      credentials: xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
      rootInvocation: entry.rootInvocation()
    });
  });

  if (!rewroteEntry) {
    return transactionXdr;
  }

  hostFunctionOp.auth(authorized);
  return new Transaction(envelope, stellarNetwork.networkPassphrase).toXDR();
}

export async function signAndSubmitTransaction(
  server: rpc.Server,
  transactionXdr: string,
  signerAddress: string
): Promise<TransactionResult> {
  const authorizedXdr = authorizeEntriesWithSourceAccount(transactionXdr, signerAddress);

  const signed = await signTransaction(authorizedXdr, {
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
    const diagnosticEvents = sent.diagnosticEvents
      ?.map((event) => event.toXDR("base64"))
      .join(", ");
    throw new Error(
      [
        sent.errorResult?.toString() ?? "Transaction submission failed.",
        diagnosticEvents ? `Diagnostics: ${diagnosticEvents}` : ""
      ].filter(Boolean).join(" ")
    );
  }

  return waitForTransaction(server, sent.hash);
}

export async function waitForTransaction(
  server: rpc.Server,
  hash: string
): Promise<TransactionResult> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await server.getTransaction(hash);
    if (response.status === "SUCCESS") {
      return {
        hash,
        status: response.status,
        returnValue: response.returnValue ? scValToNative(response.returnValue) : undefined
      };
    }
    if (response.status === "FAILED") {
      const diagnosticEvents = response.diagnosticEventsXdr
        ?.map((event) => event.toXDR("base64"))
        .join(", ");
      throw new Error(
        [
          `Transaction failed: ${hash}`,
          response.resultXdr ? `Result: ${response.resultXdr.toXDR("base64")}` : "",
          diagnosticEvents ? `Diagnostics: ${diagnosticEvents}` : ""
        ].filter(Boolean).join(" ")
      );
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  }

  throw new Error(`Transaction did not confirm in time: ${hash}`);
}
