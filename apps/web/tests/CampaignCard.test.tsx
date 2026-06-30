import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignCard } from "@/features/campaigns/CampaignCard";

const campaign = {
  id: "CCAMPAIGN",
  title: "Open Source AI Course",
  description: "A real Testnet campaign.",
  developer: "GDEVELOPER",
  goalAmount: 1200,
  totalInvested: 875,
  fundingDeadline: "2027-01-01T00:00:00.000Z",
  metadataUri: "ipfs://course",
  refundRatio: 60,
  usableRatio: 40,
  votingDuration: 604800,
  status: "Active" as const
};

describe("CampaignCard", () => {
  it("renders title, goal, and status", () => {
    render(<CampaignCard campaign={campaign} />);

    expect(screen.getByText("Open Source AI Course")).toBeInTheDocument();
    expect(screen.getByText(/875 \/ 1200 XLM/)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows goal reached when funding is complete but campaign is not completed", () => {
    render(<CampaignCard campaign={{ ...campaign, totalInvested: 1200 }} />);

    expect(screen.getByText("Goal reached")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("shows completed when the campaign is completed", () => {
    render(<CampaignCard campaign={{ ...campaign, status: "Approved", totalInvested: 1200 }} />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("Goal reached")).not.toBeInTheDocument();
  });
});
