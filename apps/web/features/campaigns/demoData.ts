import type { BuyerOrder, Campaign } from "./types";

export const demoCampaigns: Campaign[] = [
  {
    id: "CDLZ6...AIKIT",
    title: "Open Source AI Course",
    description: "A hands-on course for building small AI products with reproducible examples.",
    seller: "GDT4...SELLER",
    goalAmount: 1200,
    totalRaised: 875,
    deadline: "2026-07-15T12:00:00.000Z",
    metadataUri: "ipfs://bitstarter/ai-course",
    status: "Active"
  },
  {
    id: "CBIT...GAME",
    title: "Indie Game Launch Kit",
    description: "Pixel art assets, build scripts, and a release checklist for indie game creators.",
    seller: "GBV2...SELLER",
    goalAmount: 800,
    totalRaised: 800,
    deadline: "2026-07-01T12:00:00.000Z",
    metadataUri: "ipfs://bitstarter/game-kit",
    status: "Successful"
  },
  {
    id: "CREF...TOOLS",
    title: "Creator Analytics SaaS",
    description: "Privacy-focused launch analytics for newsletters, courses, and app preorders.",
    seller: "GAF9...SELLER",
    goalAmount: 1500,
    totalRaised: 260,
    deadline: "2026-06-01T12:00:00.000Z",
    metadataUri: "ipfs://bitstarter/analytics",
    status: "Failed"
  }
];

export const demoOrders: BuyerOrder[] = [
  { campaignId: "CDLZ6...AIKIT", buyer: "GUSER...TEST", amount: 50, refundable: false },
  { campaignId: "CREF...TOOLS", buyer: "GUSER...TEST", amount: 35, refundable: true }
];
