import { CampaignCard } from "@/features/campaigns/CampaignCard";
import type { Campaign } from "@/features/campaigns/types";
import { listCampaigns } from "@/lib/contracts/campaignClient";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  let campaigns: Campaign[] = [];
  let error = "";

  try {
    campaigns = await listCampaigns();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load campaigns from Stellar Testnet.";
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Campaign market</p>
          <h1 className="mt-2 text-4xl font-semibold">Explore Campaigns</h1>
          <p className="mt-2 text-slate-700">Browse Stellar Testnet investment campaigns and funding status.</p>
        </div>
        <div className="rounded-md border border-line bg-paper px-4 py-3 text-sm font-semibold">
          {campaigns.length} listed
        </div>
      </div>
      {error ? (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {campaigns.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-paper p-10 text-center text-slate-600">
          No campaigns found.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
        </div>
      )}
    </div>
  );
}
