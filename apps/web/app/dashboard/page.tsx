import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Campaign } from "@/features/campaigns/types";
import { listCampaigns } from "@/lib/contracts/campaignClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let campaigns: Campaign[] = [];
  let error = "";

  try {
    campaigns = await listCampaigns();
  } catch (err) {
    error = err instanceof Error ? err.message : "Unable to load dashboard data from Stellar Testnet.";
  }

  const withdrawable = campaigns.filter((campaign) => campaign.status === "Approved");

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Operator view</p>
        <h1 className="mt-2 text-4xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-700">Review investment campaigns, refundable campaigns, and withdrawable funds.</p>
      </div>
      {error ? (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Campaigns" value={campaigns.length} />
        <Metric label="Active" value={campaigns.filter((campaign) => campaign.status === "Active").length} />
        <Metric label="Refundable" value={campaigns.filter((campaign) => ["Rejected", "Cancelled"].includes(campaign.status)).length} />
        <Metric label="Withdrawable" value={withdrawable.length} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-line bg-paper p-5 shadow-[0_1px_0_rgba(17,20,22,0.06)]">
          <h2 className="text-lg font-semibold">Investment Campaigns</h2>
          <div className="mt-4 space-y-3">
            {campaigns.length === 0 ? <p className="text-sm text-slate-600">No campaigns found on Testnet yet.</p> : null}
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${encodeURIComponent(campaign.id)}`} className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel p-3 transition hover:border-ink">
                <span className="font-medium">{campaign.title}</span>
                <StatusBadge status={campaign.status} totalInvested={campaign.totalInvested} goalAmount={campaign.goalAmount} />
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-line bg-paper p-5 shadow-[0_1px_0_rgba(17,20,22,0.06)]">
          <h2 className="text-lg font-semibold">Investor Positions</h2>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Investor position history comes from campaign contracts. Connect a wallet and open a campaign to invest, claim refunds, or withdraw developer funds.
          </p>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-paper p-5 shadow-[0_1px_0_rgba(17,20,22,0.06)]">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
