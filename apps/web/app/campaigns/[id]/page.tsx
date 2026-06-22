import { notFound } from "next/navigation";
import { CampaignActions } from "@/features/campaigns/CampaignActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActivityFeed } from "@/features/realtime/ActivityFeed";
import { getCampaign } from "@/lib/contracts/campaignClient";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaign(decodeURIComponent(id));
  if (!campaign) notFound();

  const progress = Math.min(100, Math.round((campaign.totalRaised / campaign.goalAmount) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-line bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{campaign.title}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">{campaign.description}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>
        <div className="mt-8 h-3 rounded-full bg-slate-200">
          <div className="h-3 rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Raised</dt>
            <dd className="text-xl font-semibold">{campaign.totalRaised} XLM</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Goal</dt>
            <dd className="text-xl font-semibold">{campaign.goalAmount} XLM</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Deadline</dt>
            <dd>{new Date(campaign.deadline).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Seller</dt>
            <dd className="truncate font-mono text-sm">{campaign.seller}</dd>
          </div>
        </dl>
        <CampaignActions campaign={campaign} />
      </section>
      <ActivityFeed campaignId={campaign.id} />
    </div>
  );
}
