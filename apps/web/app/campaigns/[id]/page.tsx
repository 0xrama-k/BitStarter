import { notFound } from "next/navigation";
import { CampaignActions } from "@/features/campaigns/CampaignActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActivityFeed } from "@/features/realtime/ActivityFeed";
import { getCampaign } from "@/lib/contracts/campaignClient";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaign(decodeURIComponent(id));
  if (!campaign) notFound();

  const progress = Math.min(100, Math.round((campaign.totalInvested / campaign.goalAmount) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-md border border-line bg-paper p-6 shadow-[6px_6px_0_#d9d4c9]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Campaign detail</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight">{campaign.title}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-700">{campaign.description}</p>
          </div>
          <StatusBadge status={campaign.status} totalInvested={campaign.totalInvested} goalAmount={campaign.goalAmount} />
        </div>
        <div className="mt-8 h-3.5 rounded-full border border-line bg-panel p-0.5">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-line bg-panel p-4">
            <dt className="text-sm text-slate-500">Raised</dt>
            <dd className="mt-1 text-xl font-semibold">{campaign.totalInvested} XLM</dd>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <dt className="text-sm text-slate-500">Goal</dt>
            <dd className="mt-1 text-xl font-semibold">{campaign.goalAmount} XLM</dd>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <dt className="text-sm text-slate-500">Deadline</dt>
            <dd className="mt-1 font-medium">{new Date(campaign.fundingDeadline).toLocaleString()}</dd>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <dt className="text-sm text-slate-500">Developer</dt>
            <dd className="mt-1 truncate font-mono text-sm">{campaign.developer}</dd>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <dt className="text-sm text-slate-500">Refund reserve</dt>
            <dd className="mt-1 font-medium">{campaign.refundRatio}%</dd>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <dt className="text-sm text-slate-500">Developer usable</dt>
            <dd className="mt-1 font-medium">{campaign.usableRatio}%</dd>
          </div>
        </dl>
        <CampaignActions campaign={campaign} />
      </section>
      <ActivityFeed campaignId={campaign.id} />
    </div>
  );
}
