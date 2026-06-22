import type { CreateCampaignInput } from "@/lib/validation/campaignSchema";
import type { Campaign } from "@/features/campaigns/types";
import { demoCampaigns } from "@/features/campaigns/demoData";

export async function listCampaigns(): Promise<Campaign[]> {
  return demoCampaigns;
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  return demoCampaigns.find((campaign) => campaign.id === id) ?? null;
}

export async function createCampaign(input: CreateCampaignInput): Promise<{ transactionHash: string; campaignId: string }> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    transactionHash: `testnet-${Date.now().toString(16)}`,
    campaignId: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  };
}

export async function placePreorder(campaignId: string, amount: number): Promise<{ transactionHash: string }> {
  if (amount <= 0) throw new Error("Invalid preorder amount.");
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { transactionHash: `order-${campaignId}-${Date.now().toString(16)}` };
}

export async function claimRefund(campaignId: string): Promise<{ transactionHash: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { transactionHash: `refund-${campaignId}-${Date.now().toString(16)}` };
}

export async function withdrawFunds(campaignId: string): Promise<{ transactionHash: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { transactionHash: `withdraw-${campaignId}-${Date.now().toString(16)}` };
}
