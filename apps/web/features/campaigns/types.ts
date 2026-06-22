export type CampaignStatus = "Active" | "Successful" | "Failed" | "Withdrawn" | "Cancelled";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  seller: string;
  goalAmount: number;
  totalRaised: number;
  deadline: string;
  metadataUri: string;
  status: CampaignStatus;
};

export type BuyerOrder = {
  campaignId: string;
  buyer: string;
  amount: number;
  refundable: boolean;
};
