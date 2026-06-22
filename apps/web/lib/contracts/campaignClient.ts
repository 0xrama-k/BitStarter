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

const readSourceAccount =
  process.env.NEXT_PUBLIC_STELLAR_READ_SOURCE_ACCOUNT ??
  "GCK7A2SQAHZVIMAE3FWZLNWBUH3UQUCHBGEAOGSZOEZAYPNP3OBAFWLE";

type CampaignInfoNative = {
  description?: string;
  goal_amount?: bigint | number | string;
  metadata_uri?: string;
  seller?: string;
  status?: { tag?: CampaignStatus; values?: unknown[] } | CampaignStatus;
  title?: string;
  total_raised?: bigint | number | string;
  deadline?: bigint | number | string;
};

type CampaignSummaryNative = {
  id?: string;
  seller?: string;
  title?: string;
  goal_amount?: bigint | number | string;
  deadline?: bigint | number | string;
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

function statusToString(status: CampaignInfoNative["status"]): CampaignStatus {
  if (!status) return "Active";
  if (typeof status === "string") return status;
  return status.tag ?? "Active";
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

function campaignFromInfo(id: string, fallback: Partial<Campaign>, info: CampaignInfoNative): Campaign {
  return {
    id,
    title: info.title ?? fallback.title ?? "Untitled campaign",
    description: info.description ?? fallback.description ?? "No description provided.",
    seller: info.seller ?? fallback.seller ?? "",
    goalAmount: toNumber(info.goal_amount) || fallback.goalAmount || 0,
    totalRaised: toNumber(info.total_raised) || fallback.totalRaised || 0,
    deadline: new Date(toNumber(info.deadline) * 1000).toISOString(),
    metadataUri: info.metadata_uri ?? fallback.metadataUri ?? "",
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
      const info = await simulateContractCall<CampaignInfoNative>(id, "get_campaign_info");
      return campaignFromInfo(id, {
        seller: summary.seller,
        title: summary.title,
        goalAmount: toNumber(summary.goal_amount),
        deadline: new Date(toNumber(summary.deadline) * 1000).toISOString(),
        metadataUri: summary.metadata_uri
      }, info);
    })
  );
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const info = await simulateContractCall<CampaignInfoNative>(id, "get_campaign_info");
    return campaignFromInfo(id, {}, info);
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
  const result = await submitContractCall(requireFactoryContractId(), "create_campaign", signer, [
    Address.fromString(signer).toScVal(),
    nativeToScVal(input.title, { type: "string" }),
    nativeToScVal(input.description, { type: "string" }),
    nativeToScVal(BigInt(Math.trunc(input.goalAmount)), { type: "i128" }),
    nativeToScVal(BigInt(deadlineSeconds), { type: "u64" }),
    nativeToScVal(input.metadataUri, { type: "string" })
  ]);

  return {
    transactionHash: result.hash,
    campaignId: result.hash
  };
}

export async function placePreorder(campaignId: string, amount: number): Promise<{ transactionHash: string }> {
  if (amount <= 0) throw new Error("Invalid preorder amount.");
  const signer = (await getAddress()).address;
  if (!signer) throw new Error("Connect Freighter before placing a preorder.");

  const result = await submitContractCall(campaignId, "place_order", signer, [
    Address.fromString(signer).toScVal(),
    nativeToScVal(BigInt(Math.trunc(amount)), { type: "i128" })
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

export async function withdrawFunds(campaignId: string): Promise<{ transactionHash: string }> {
  const signer = (await getAddress()).address;
  if (!signer) throw new Error("Connect Freighter before withdrawing funds.");

  const result = await submitContractCall(campaignId, "withdraw_funds", signer, [
    Address.fromString(signer).toScVal()
  ]);
  return { transactionHash: result.hash };
}
