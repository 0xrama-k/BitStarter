import { CreateCampaignForm } from "@/features/campaigns/CreateCampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div className="border-b border-line pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">New launch</p>
        <h1 className="mt-2 text-4xl font-semibold">Create Campaign</h1>
        <p className="mt-2 text-slate-700">Launch a Stellar Testnet investment campaign with refund-protected settlement.</p>
      </div>
      <CreateCampaignForm />
    </div>
  );
}
