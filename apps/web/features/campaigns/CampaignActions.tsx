"use client";

import { useState } from "react";
import type { Campaign } from "./types";
import { claimRefund, placePreorder, withdrawFunds } from "@/lib/contracts/campaignClient";
import { parseStellarError } from "@/lib/errors/parseStellarError";

export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const [amount, setAmount] = useState("25");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: "order" | "refund" | "withdraw") {
    setLoading(action);
    setMessage("");
    setError("");
    try {
      const result =
        action === "order"
          ? await placePreorder(campaign.id, Number(amount))
          : action === "refund"
            ? await claimRefund(campaign.id)
            : await withdrawFunds(campaign.id);
      setMessage(`Transaction submitted: ${result.transactionHash}`);
    } catch (err) {
      setError(parseStellarError(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-8 space-y-4 border-t border-line pt-6">
      <label className="block text-sm font-medium" htmlFor="amount">Preorder amount</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="amount"
          type="number"
          min="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="min-h-11 flex-1 rounded-md border border-line px-3"
        />
        <button disabled={loading !== null || campaign.status !== "Active"} onClick={() => run("order")} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading === "order" ? "Waiting for transaction..." : "Place preorder"}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button disabled={loading !== null || !["Failed", "Cancelled"].includes(campaign.status)} onClick={() => run("refund")} className="rounded-md border border-line bg-white px-4 py-2 text-sm disabled:opacity-50">
          {loading === "refund" ? "Claiming refund..." : "Claim refund"}
        </button>
        <button disabled={loading !== null || campaign.status !== "Successful"} onClick={() => run("withdraw")} className="rounded-md border border-line bg-white px-4 py-2 text-sm disabled:opacity-50">
          {loading === "withdraw" ? "Withdrawing funds..." : "Withdraw funds"}
        </button>
      </div>
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
    </div>
  );
}
