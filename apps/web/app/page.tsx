import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ShieldCheck, TimerReset, WalletCards } from "lucide-react";
import { ActivityFeed } from "@/features/realtime/ActivityFeed";

const steps: { title: string; text: string; Icon: LucideIcon }[] = [
  {
    title: "Create",
    text: "Developers launch an investment campaign with funding, reserve, and voting settings.",
    Icon: ShieldCheck
  },
  {
    title: "Escrow",
    text: "Investors fund campaigns while the contract splits usable funds and protected reserves.",
    Icon: WalletCards
  },
  {
    title: "Settle",
    text: "Capital-weighted voting approves final withdrawal or unlocks protected refunds.",
    Icon: TimerReset
  }
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 py-8 md:grid-cols-[1.28fr_0.72fr] md:items-center">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold uppercase text-accent">
            Stellar Testnet crowdfunding
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] md:text-7xl">
            Refund-protected funding for software launches.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            BitStarter uses Stellar/Soroban smart contracts to split each investment into developer-usable funds and a protected refund reserve.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[4px_4px_0_#d9d4c9] transition hover:-translate-y-0.5">
              Create Campaign <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/campaigns" className="rounded-md border border-line bg-paper px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink">
              Explore Campaigns
            </Link>
          </div>
        </div>
        <ActivityFeed />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {steps.map(({ title, text, Icon }) => (
          <div key={title} className="rounded-md border border-line bg-paper p-5 shadow-[0_1px_0_rgba(17,20,22,0.06)]">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-line bg-panel">
              <Icon size={20} className="text-accent" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
