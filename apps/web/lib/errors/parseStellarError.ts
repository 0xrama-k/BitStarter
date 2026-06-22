import { userFriendlyErrors } from "./userFriendlyErrors";

export function parseStellarError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("reject")) return userFriendlyErrors.transaction_rejected;
    if (message.includes("rpc") || message.includes("fetch")) return userFriendlyErrors.rpc_unavailable;
    if (message.includes("refund")) return userFriendlyErrors.refund_not_available;
    if (message.includes("withdraw")) return userFriendlyErrors.withdraw_not_allowed;
    return error.message;
  }
  return userFriendlyErrors.contract_call_failed;
}
