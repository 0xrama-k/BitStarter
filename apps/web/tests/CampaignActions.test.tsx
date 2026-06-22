import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CampaignActions } from "@/features/campaigns/CampaignActions";

vi.mock("@/lib/contracts/campaignClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/contracts/campaignClient")>("@/lib/contracts/campaignClient");
  return {
    ...actual,
    placePreorder: vi.fn().mockRejectedValue(new Error("Transaction failed"))
  };
});

describe("CampaignActions", () => {
  it("shows an error message on failed transaction", async () => {
    render(<CampaignActions campaign={{
      id: "CCAMPAIGN",
      title: "Open Source AI Course",
      description: "A real Testnet campaign.",
      seller: "GSELLER",
      goalAmount: 1200,
      totalRaised: 875,
      deadline: "2027-01-01T00:00:00.000Z",
      metadataUri: "ipfs://course",
      status: "Active"
    }} />);

    await userEvent.click(screen.getByRole("button", { name: "Place preorder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Transaction failed");
  });
});
