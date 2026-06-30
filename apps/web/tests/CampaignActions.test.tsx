import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignActions } from "@/features/campaigns/CampaignActions";
import { invest } from "@/lib/contracts/campaignClient";

const refresh = vi.fn();

vi.mock("@/lib/contracts/campaignClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/contracts/campaignClient")>("@/lib/contracts/campaignClient");
  return {
    ...actual,
    invest: vi.fn().mockRejectedValue(new Error("Transaction failed"))
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh })
}));

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

describe("CampaignActions", () => {
  beforeEach(() => {
    refresh.mockClear();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(invest).mockRejectedValue(new Error("Transaction failed"));
  });

  it("shows an error message on failed transaction", async () => {
    render(<CampaignActions campaign={campaign} />);

    await userEvent.click(screen.getByRole("button", { name: "Invest" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Transaction failed");
  });

  it("refreshes campaign data after a successful transaction", async () => {
    vi.mocked(invest).mockResolvedValueOnce({ transactionHash: "real-testnet-hash" });
    render(<CampaignActions campaign={campaign} />);

    await userEvent.click(screen.getByRole("button", { name: "Invest" }));

    expect(await screen.findByText(/real-testnet-hash/)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("hides withdrawal buttons when the connected wallet is not the campaign creator", () => {
    window.sessionStorage.setItem("bitstarter.walletSession", JSON.stringify({
      publicKey: "GINVESTOR",
      connected: true,
      providerId: "freighter",
      providerName: "Freighter"
    }));

    render(<CampaignActions campaign={campaign} />);

    expect(screen.queryByRole("button", { name: "Withdraw usable funds" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Withdraw remaining funds" })).not.toBeInTheDocument();
  });

  it("shows withdrawal buttons when the connected wallet is the campaign creator", async () => {
    window.sessionStorage.setItem("bitstarter.walletSession", JSON.stringify({
      publicKey: "gdeveloper",
      connected: true,
      providerId: "freighter",
      providerName: "Freighter"
    }));

    render(<CampaignActions campaign={campaign} />);

    expect(await screen.findByRole("button", { name: "Withdraw usable funds" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw remaining funds" })).toBeInTheDocument();
  });
});
