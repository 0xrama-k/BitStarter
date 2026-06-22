export const userFriendlyErrors: Record<string, string> = {
  wallet_not_connected: "Connect a Stellar Testnet wallet before submitting a transaction.",
  wrong_network: "Switch your wallet to Stellar Testnet.",
  invalid_goal_amount: "Enter a goal amount greater than zero.",
  invalid_deadline: "Choose a future deadline.",
  transaction_rejected: "The transaction was rejected in your wallet.",
  transaction_failed: "The transaction failed on Stellar Testnet.",
  contract_call_failed: "The contract call failed. Check the campaign status and try again.",
  rpc_unavailable: "Stellar RPC is unavailable. Try again in a moment.",
  campaign_not_found: "Campaign not found.",
  refund_not_available: "Refund is not available for this campaign.",
  withdraw_not_allowed: "Withdraw is only available after the funding goal is reached."
};
