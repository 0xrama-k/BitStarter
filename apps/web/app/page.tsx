import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ShieldCheck, TimerReset, WalletCards } from "lucide-react";
import { ActivityFeed } from "@/features/realtime/ActivityFeed";

const steps: { title: string; text: string; Icon: LucideIcon }[] = [
  {
    title: "Create",
    text: "Sellers launch a preorder campaign with a funding goal and deadline.",
    Icon: ShieldCheck
  },
  {
    title: "Escrow",
    text: "Buyers place preorders while the contract tracks contributions.",
    Icon: WalletCards
  },
  {
    title: "Settle",
    text: "Successful sellers withdraw; failed campaigns unlock buyer refunds.",
    Icon: TimerReset
  }
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 py-6 md:grid-cols-[1.35fr_0.65fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-accent">Stellar Testnet escrow</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Trustless preorders for digital launches.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            BitStarter uses Stellar/Soroban smart contracts to lock preorder funds until a campaign reaches its goal. If a launch fails or is cancelled, buyers claim refunds directly.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm font-medium text-white">
              Create Campaign <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/campaigns" className="rounded-md border border-line bg-white px-5 py-3 text-sm font-medium">
              Explore Campaigns
            </Link>
          </div>
        </div>
        <ActivityFeed />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {steps.map(({ title, text, Icon }) => (
          <div key={title} className="rounded-lg border border-line bg-white p-5">
            <Icon size={22} className="text-accent" aria-hidden="true" />
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
