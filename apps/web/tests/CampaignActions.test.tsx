import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CampaignActions } from "@/features/campaigns/CampaignActions";
import { demoCampaigns } from "@/features/campaigns/demoData";

vi.mock("@/lib/contracts/campaignClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/contracts/campaignClient")>("@/lib/contracts/campaignClient");
  return {
    ...actual,
    placePreorder: vi.fn().mockRejectedValue(new Error("Transaction failed"))
  };
});

describe("CampaignActions", () => {
  it("shows an error message on failed transaction", async () => {
    render(<CampaignActions campaign={demoCampaigns[0]} />);

    await userEvent.click(screen.getByRole("button", { name: "Place preorder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Transaction failed");
  });
});
