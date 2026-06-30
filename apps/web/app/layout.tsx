import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { WalletStatus } from "@/features/wallet/WalletStatus";

export const metadata: Metadata = {
  title: "BitStarter",
  description: "Refund-protected investment crowdfunding on Stellar Testnet"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-md border border-ink bg-ink text-sm font-bold text-white">B</span>
              <span>BitStarter</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/campaigns" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-panel hover:text-ink">Explore</Link>
              <Link href="/campaigns/new" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-panel hover:text-ink">Create</Link>
              <Link href="/dashboard" className="rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-panel hover:text-ink">Dashboard</Link>
              <WalletStatus />
            </div>
          </nav>
        </header>
        <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
