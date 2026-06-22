import { CampaignCard } from "@/features/campaigns/CampaignCard";
import { listCampaigns } from "@/lib/contracts/campaignClient";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Explore Campaigns</h1>
        <p className="mt-2 text-slate-600">Browse Stellar Testnet preorder campaigns and funding status.</p>
      </div>
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center text-slate-600">
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
