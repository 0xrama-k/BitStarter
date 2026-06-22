export type CampaignEventType =
  | "campaign_created"
  | "order_placed"
  | "goal_reached"
  | "refund_claimed"
  | "funds_withdrawn"
  | "campaign_cancelled";

export type CampaignEvent = {
  id: string;
  type: CampaignEventType;
  message: string;
  createdAt: string;
};
