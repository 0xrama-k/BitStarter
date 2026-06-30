"use client";

import { Radio } from "lucide-react";
import { useCampaignEvents } from "./useCampaignEvents";

export function ActivityFeed({ campaignId }: { campaignId?: string }) {
  const { events, loading } = useCampaignEvents(campaignId);

  return (
    <section className="rounded-md border border-line bg-paper p-5 shadow-[6px_6px_0_#d9d4c9]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-line bg-panel">
            <Radio size={17} className="text-accent" aria-hidden="true" />
          </span>
          <h2 className="font-semibold">Live Activity</h2>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
      </div>
      {loading ? <p className="mt-4 text-sm text-slate-600">Loading live activity...</p> : null}
      {!loading && events.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-line bg-panel p-4 text-sm text-slate-600">No recent contract events found.</p>
      ) : null}
      <ul className="mt-4 space-y-3 text-sm">
        {events.map((event) => (
          <li key={event.id} className="rounded-md border border-line bg-panel p-3 text-slate-700">
            {event.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
