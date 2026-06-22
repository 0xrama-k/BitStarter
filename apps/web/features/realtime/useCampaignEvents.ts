"use client";

import { useEffect, useState } from "react";
import type { CampaignEvent } from "./eventTypes";

const seedEvents: CampaignEvent[] = [
  {
    id: "evt-created",
    type: "campaign_created",
    message: "New campaign created: Open Source AI Course",
    createdAt: new Date().toISOString()
  },
  {
    id: "evt-order",
    type: "order_placed",
    message: "50 XLM preorder placed",
    createdAt: new Date().toISOString()
  }
];

export function useCampaignEvents(campaignId?: string) {
  const [events, setEvents] = useState<CampaignEvent[]>(seedEvents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const interval = window.setInterval(() => {
      if (!active) return;
      setEvents((current) => current);
      setLoading(false);
    }, 3500);

    setLoading(false);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [campaignId]);

  return { events, loading };
}
