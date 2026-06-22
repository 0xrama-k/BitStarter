import Link from "next/link";
import { demoCampaigns, demoOrders } from "@/features/campaigns/demoData";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function DashboardPage() {
  const withdrawable = demoCampaigns.filter((campaign) => campaign.status === "Successful");
  const refundable = demoOrders.filter((order) => order.refundable);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-600">Review seller campaigns, buyer orders, refundable campaigns, and withdrawable funds.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Seller campaigns" value={demoCampaigns.length} />
        <Metric label="Buyer orders" value={demoOrders.length} />
        <Metric label="Refundable" value={refundable.length} />
        <Metric label="Withdrawable" value={withdrawable.length} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="font-semibold">Seller Campaigns</h2>
          <div className="mt-4 space-y-3">
            {demoCampaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${encodeURIComponent(campaign.id)}`} className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
                <span className="font-medium">{campaign.title}</span>
                <StatusBadge status={campaign.status} />
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5">
          <h2 className="font-semibold">Buyer Orders</h2>
          <div className="mt-4 space-y-3">
            {demoOrders.map((order) => (
              <div key={`${order.campaignId}-${order.buyer}`} className="rounded-md border border-line p-3">
                <p className="font-medium">{order.amount} XLM</p>
                <p className="mt-1 text-sm text-slate-600">Campaign {order.campaignId}</p>
                <p className="mt-1 text-sm">{order.refundable ? "Refund available" : "Refund locked while campaign is active"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
