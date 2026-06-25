import { getAddress } from "@stellar/freighter-api";
import {
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  Networks,
  rpc,
  scValToNative,
  TransactionBuilder
} from "@stellar/stellar-sdk";
import type { Campaign, CampaignStatus } from "@/features/campaigns/types";
import type { CreateCampaignInput } from "@/lib/validation/campaignSchema";
import { createRpcClient } from "@/lib/stellar/client";
import { stellarNetwork } from "@/lib/stellar/network";
import { signAndSubmitTransaction } from "@/lib/stellar/transactions";

const STROOPS_PER_XLM = 10_000_000;

const readSourceAccount =
  process.env.NEXT_PUBLIC_STELLAR_READ_SOURCE_ACCOUNT ??
  "GCK7A2SQAHZVIMAE3FWZLNWBUH3UQUCHBGEAOGSZOEZAYPNP3OBAFWLE";

type CampaignInfoNative = {
  description?: string;
  funding_goal?: bigint | number | string;
  metadata_uri?: string;
  developer?: string;
  status?: { tag?: CampaignStatus; values?: unknown[] } | CampaignStatus | [CampaignStatus, ...unknown[]];
  title?: string;
  funding_deadline?: bigint | number | string;
  refund_ratio?: bigint | number | string;
  usable_ratio?: bigint | number | string;
  voting_duration?: bigint | number | string;
};

type CampaignSummaryNative = {
  id?: string;
  developer?: string;
  title?: string;
  funding_goal?: bigint | number | string;
  funding_deadline?: bigint | number | string;
  metadata_uri?: string;
};

function requireFactoryContractId() {
  if (!stellarNetwork.factoryContractId) {
    throw new Error("Factory contract ID is not configured.");
  }
  return stellarNetwork.factoryContractId;
}

function toNumber(value: bigint | number | string | undefined): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return value ?? 0;
}

function stroopsToXlm(value: bigint | number | string | undefined): number {
  return toNumber(value) / STROOPS_PER_XLM;
}

function xlmToStroops(value: number): bigint {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid XLM amount.");
  }
  return BigInt(Math.round(value * STROOPS_PER_XLM));
}

function statusToString(status: CampaignInfoNative["status"]): CampaignStatus {
  if (!status) return "Active";
  if (typeof status === "string") return status;
  if (Array.isArray(status) && typeof status[0] === "string") return status[0];
  if ("tag" in status) return status.tag ?? "Active";
  return "Active";
}

async function buildInvocation(
  server: rpc.Server,
  sourcePublicKey: string,
  contractId: string,
  method: string,
  args = [] as ReturnType<typeof nativeToScVal>[]
) {
  const source = await server.getAccount(sourcePublicKey);
  const contract = new Contract(contractId);
  return new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET
  })
    .setTimeout(60)
    .addOperation(contract.call(method, ...args))
    .build();
}

async function simulateContractCall<T>(
  contractId: string,
  method: string,
  args = [] as ReturnType<typeof nativeToScVal>[]
): Promise<T> {
  const server = createRpcClient();
  const transaction = await buildInvocation(server, readSourceAccount, contractId, method, args);
  const simulation = await server.simulateTransaction(transaction);

  if ("error" in simulation) {
    throw new Error(simulation.error);
  }
  if (!simulation.result) {
    throw new Error("Contract simulation returned no result.");
  }

  return scValToNative(simulation.result.retval) as T;
}

async function submitContractCall(
  contractId: string,
  method: string,
  signerPublicKey: string,
  args = [] as ReturnType<typeof nativeToScVal>[]
) {
  const server = createRpcClient();
  const transaction = await buildInvocation(server, signerPublicKey, contractId, method, args);
  const prepared = await server.prepareTransaction(transaction);
  return signAndSubmitTransaction(server, prepared.toXDR(), signerPublicKey);
}

function campaignFromInfo(
  id: string,
  fallback: Partial<Campaign>,
  info: CampaignInfoNative,
  totalInvested = fallback.totalInvested ?? 0,
  totalUsableAllocated = fallback.totalUsableAllocated ?? 0,
  totalUsableWithdrawn = fallback.totalUsableWithdrawn ?? 0
): Campaign {
  const usableAvailable = Math.max(0, totalUsableAllocated - totalUsableWithdrawn);
  return {
    id,
    title: info.title ?? fallback.title ?? "Untitled campaign",
    description: info.description ?? fallback.description ?? "No description provided.",
    developer: info.developer ?? fallback.developer ?? "",
    goalAmount: stroopsToXlm(info.funding_goal) || fallback.goalAmount || 0,
    totalInvested,
    fundingDeadline: new Date(toNumber(info.funding_deadline) * 1000).toISOString(),
    metadataUri: info.metadata_uri ?? fallback.metadataUri ?? "",
    refundRatio: toNumber(info.refund_ratio) || fallback.refundRatio || 0,
    usableRatio: toNumber(info.usable_ratio) || fallback.usableRatio || 0,
    totalUsableAllocated,
    totalUsableWithdrawn,
    usableAvailable,
    votingDuration: toNumber(info.voting_duration) || fallback.votingDuration || 0,
    status: statusToString(info.status)
  };
}

export async function listCampaigns(): Promise<Campaign[]> {
  const factoryId = requireFactoryContractId();
  const summaries = await simulateContractCall<CampaignSummaryNative[]>(
    factoryId,
    "get_all_campaigns"
  );

  return Promise.all(
    summaries.map(async (summary) => {
      const id = String(summary.id ?? "");
      if (!id) throw new Error("Campaign summary is missing a contract ID.");
      const [info, totalInvestedStroops, totalUsableAllocatedStroops, totalUsableWithdrawnStroops] = await Promise.all([
        simulateContractCall<CampaignInfoNative>(id, "get_campaign_info"),
        simulateContractCall<bigint | number | string>(id, "get_total_invested"),
        simulateContractCall<bigint | number | string>(id, "get_total_usable_allocated"),
        simulateContractCall<bigint | number | string>(id, "get_total_usable_withdrawn")
      ]);
      return campaignFromInfo(id, {
        developer: summary.developer,
        title: summary.title,
        goalAmount: stroopsToXlm(summary.funding_goal),
        fundingDeadline: new Date(toNumber(summary.funding_deadline) * 1000).toISOString(),
        metadataUri: summary.metadata_uri
      }, info, stroopsToXlm(totalInvestedStroops), stroopsToXlm(totalUsableAllocatedStroops), stroopsToXlm(totalUsableWithdrawnStroops));
    })
  );
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const [info, totalInvestedStroops, totalUsableAllocatedStroops, totalUsableWithdrawnStroops] = await Promise.all([
      simulateContractCall<CampaignInfoNative>(id, "get_campaign_info"),
      simulateContractCall<bigint | number | string>(id, "get_total_invested"),
      simulateContractCall<bigint | number | string>(id, "get_total_usable_allocated"),
      simulateContractCall<bigint | number | string>(id, "get_total_usable_withdrawn")
    ]);
    return campaignFromInfo(id, {}, info, stroopsToXlm(totalInvestedStroops), stroopsToXlm(totalUsableAllocatedStroops), stroopsToXlm(totalUsableWithdrawnStroops));
  } catch {
    return null;
  }
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ transactionHash: string; campaignId: string }> {
  const signer = (await getAddress()).address;
  if (!signer) throw new Error("Connect Freighter before creating a campaign.");

  const deadlineSeconds = Math.floor(new Date(input.deadline).getTime() / 1000);
  const votingDurationSeconds = Math.round(input.votingDurationDays * 24 * 60 * 60);
  const result = await submitContractCall(requireFactoryContractId(), "create_campaign", signer, [
    Address.fromString(signer).toScVal(),
    nativeToScVal(input.title, { type: "string" }),
    nativeToScVal(input.description, { type: "string" }),
    nativeToScVal(input.metadataUri, { type: "string" }),
    nativeToScVal(xlmToStroops(input.goalAmount), { type: "i128" }),
    nativeToScVal(BigInt(deadlineSeconds), { type: "u64" }),
    nativeToScVal(input.refundRatio, { type: "u32" }),
    nativeToScVal(input.usableRatio, { type: "u32" }),
    nativeToScVal(BigInt(votingDurationSeconds), { type: "u64" })
  ]);

  return {
    transactionHash: result.hash,
    campaignId: typeof result.returnValue === "string" ? result.returnValue : ""
  };
}

export async function invest(campaignId: string, amount: number): Promise<{ transactionHash: string }> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid investment amount.");
  const signer = (await getAddress()).address;
  if (!signer) throw new Error("Connect Freighter before investing.");

  const result = await submitContractCall(campaignId, "invest", signer, [
    Address.fromString(signer).toScVal(),
    nativeToScVal(xlmToStroops(amount), { type: "i128" })
  ]);
  return { transactionHash: result.hash };
}

export async function claimRefund(campaignId: string): Promise<{ transactionHash: string }> {
  const signer = (await getAddress()).address;
  if (!signer) throw new Error("Connect Freighter before claiming a refund.");

  const result = await submitContractCall(stellarNetwork.refundManagerContractId, "claim_refund", signer, [
    Address.fromString(campaignId).toScVal(),
    Address.fromString(signer).toScVal()
  ]);
  return { transactionHash: result.hash };
}

export async function withdrawAvailableFunds(campaignId: string, amount: number): Promise<{ transactionHash: string }> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid withdrawal amount.");
  const signer = (await getAddress()).address;
  if (!signer) throw new Error("Connect Freighter before withdrawing funds.");

  const result = await submitContractCall(campaignId, "withdraw_available_funds", signer, [
    Address.fromString(signer).toScVal(),
    nativeToScVal(xlmToStroops(amount), { type: "i128" })
  ]);
  return { transactionHash: result.hash };
}

export async function withdrawRemainingFunds(campaignId: string): Promise<{ transactionHash: string }> {
  const signer = (await getAddress()).address;
  if (!signer) throw new Error("Connect Freighter before withdrawing remaining funds.");

  const result = await submitContractCall(campaignId, "withdraw_remaining_funds", signer, [
    Address.fromString(signer).toScVal()
  ]);
  return { transactionHash: result.hash };
}
