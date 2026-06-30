import Link from "next/link";
import type { Campaign } from "./types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = Math.min(100, Math.round((campaign.totalInvested / campaign.goalAmount) * 100));

  return (
    <article className="group rounded-md border border-line bg-paper p-5 shadow-[0_1px_0_rgba(17,20,22,0.06)] transition hover:-translate-y-0.5 hover:border-ink">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold leading-snug">{campaign.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{campaign.description}</p>
        </div>
        <StatusBadge status={campaign.status} totalInvested={campaign.totalInvested} goalAmount={campaign.goalAmount} />
      </div>
      <div className="mt-5 h-2.5 rounded-full border border-line bg-panel p-0.5">
        <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-line bg-panel p-3">
          <dt className="text-slate-500">Raised</dt>
          <dd className="mt-1 font-semibold">{campaign.totalInvested} / {campaign.goalAmount} XLM</dd>
        </div>
        <div className="rounded-md border border-line bg-panel p-3">
          <dt className="text-slate-500">Deadline</dt>
          <dd className="mt-1 font-semibold">{new Date(campaign.fundingDeadline).toLocaleDateString()}</dd>
        </div>
        <div className="col-span-2 rounded-md border border-line bg-panel p-3">
          <dt className="text-slate-500">Developer</dt>
          <dd className="mt-1 truncate font-mono text-xs">{campaign.developer}</dd>
        </div>
      </dl>
      <Link href={`/campaigns/${encodeURIComponent(campaign.id)}`} className="mt-5 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition group-hover:shadow-[3px_3px_0_#d9d4c9]">
        View campaign
      </Link>
    </article>
  );
}
