import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CampaignCard } from "@/features/campaigns/CampaignCard";
import { demoCampaigns } from "@/features/campaigns/demoData";

describe("CampaignCard", () => {
  it("renders title, goal, and status", () => {
    render(<CampaignCard campaign={demoCampaigns[0]} />);

    expect(screen.getByText("Open Source AI Course")).toBeInTheDocument();
    expect(screen.getByText(/875 \/ 1200 XLM/)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
