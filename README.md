# BitStarter

## Overview

BitStarter uses Stellar/Soroban smart contracts to create a trustless preorder escrow system. Campaign funds are locked until the campaign reaches its funding goal. If the campaign fails or is cancelled, buyers can claim refunds without trusting the seller.

## Problem

Digital product preorders often require buyers to trust a seller before the product exists. Sellers also need a clear way to prove demand before investing time into a launch.

## Solution

BitStarter lets sellers create preorder campaigns with a goal and deadline. Buyers place preorders through Stellar Testnet contracts. Successful campaigns unlock seller withdrawal; failed or cancelled campaigns unlock buyer refunds.

## Features

- Soroban smart contracts written in Rust.
- Three-contract architecture with factory, campaign, and refund manager.
- Inter-contract refund eligibility checks.
- Event-driven activity feed abstraction for near-real-time updates.
- Mobile responsive Next.js frontend.
- Client-side validation, loading states, and readable transaction errors.
- Rust contract tests and Vitest frontend tests.
- GitHub Actions CI for frontend and contract checks.
- Stellar Testnet and Vercel deployment documentation.

## Architecture

```txt
contracts/
  campaign_factory/
  preorder_campaign/
  refund_manager/
  shared/
apps/web/
  app/
  components/
  features/
  lib/
scripts/
docs/
```

See [docs/architecture.md](docs/architecture.md) for details.

## Smart Contracts

- `CampaignFactory`: initializes an admin, creates campaign records, tracks all campaigns, and stores seller-to-campaign mappings.
- `PreorderCampaign`: tracks campaign metadata, buyer preorder totals, campaign status, seller withdrawal, and cancellation.
- `RefundManager`: checks campaign state through inter-contract calls, prevents double refunds, and emits refund events.

## Inter-Contract Communication

`RefundManager` creates a `PreorderCampaign` client for the target campaign contract and calls `get_status` plus `get_buyer_order` before allowing a refund.

## Event Streaming / Real-Time Updates

Contracts emit events for campaign creation, order placement, goal reached, refunds, withdrawals, and cancellations. The frontend keeps all realtime logic in `apps/web/features/realtime`. The current Vercel-safe implementation uses polling with a parser abstraction; after deployment, wire the poller to Stellar RPC event responses for the configured contract IDs.

## Tech Stack

- Stellar Soroban smart contracts
- Rust and Soroban SDK
- Next.js, React, TypeScript
- Tailwind CSS
- Stellar JS SDK
- Vitest and React Testing Library
- GitHub Actions
- Vercel

## Local Setup

```bash
git clone https://github.com/your-org/bitstarter.git
cd bitstarter
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```txt
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_FACTORY_CONTRACT_ID=CCWOBOZBK4DMBKVZO6QEYPXMSXSY5TA66DBVVABAGHN5NUH4MBHDH5KA
NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID=CCGHFVCK6S67QJWYOVE6OSOVDKQUFRRY5XIDFGTITN52IYNJD3P3443E
NEXT_PUBLIC_PREORDER_CAMPAIGN_WASM_HASH=e007bdf2adc210a0121587afde1cfaf18f3b30500522d0bdf06f1324af0d36fe
NEXT_PUBLIC_STELLAR_READ_SOURCE_ACCOUNT=GCK7A2SQAHZVIMAE3FWZLNWBUH3UQUCHBGEAOGSZOEZAYPNP3OBAFWLE
```

Do not expose deployer private keys with `NEXT_PUBLIC_`.

## Running Tests

Frontend:

```bash
cd apps/web
npm test
npm run build
```

Contracts:

```bash
cargo test --workspace
cargo build --workspace --target wasm32v1-none --release
```

## Stellar Testnet Deployment

```bash
rustup target add wasm32v1-none
stellar keys generate bitstarter-deployer --network testnet
stellar keys fund bitstarter-deployer --network testnet
STELLAR_SOURCE=bitstarter-deployer ./scripts/deploy/deploy-testnet.sh
```

Copy the printed contract IDs into `apps/web/.env.local` and Vercel environment variables.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import it into Vercel.
3. Set the Vercel project root to `apps/web`.
4. Set the environment variables listed above.
5. Use `npm run build` as the build command.
6. Deploy.

Live demo link: `TODO`

## Contract Addresses / IDs

- CampaignFactory: `CCWOBOZBK4DMBKVZO6QEYPXMSXSY5TA66DBVVABAGHN5NUH4MBHDH5KA`
- RefundManager: `CCGHFVCK6S67QJWYOVE6OSOVDKQUFRRY5XIDFGTITN52IYNJD3P3443E`
- PreorderCampaign Wasm hash: `e007bdf2adc210a0121587afde1cfaf18f3b30500522d0bdf06f1324af0d36fe`
- Demo PreorderCampaign: `CAD6TNAY6Y5PGIZCZHWXUFOYILQBZEHQ5BOSDJEB35TJ6NJNLIILSV3R`

## Example Transaction Hash

Real campaign creation: `a612da34a5adb5d6f58b0983441723d368b2a783f02015b2981a6ba27beb704c`

Explorer: `https://stellar.expert/explorer/testnet/tx/a612da34a5adb5d6f58b0983441723d368b2a783f02015b2981a6ba27beb704c`

## Screenshots

- Mobile responsive UI: `docs/screenshots/mobile-ui.png` placeholder
- CI/CD pipeline running: `docs/screenshots/ci-pipeline.png` placeholder
- Test output with 3+ passing tests: `docs/screenshots/test-output.png` placeholder

## Demo Video

Demo video link: `TODO`

## Submission Checklist

- [ ] Public GitHub repository
- [ ] 10+ meaningful commits
- [ ] Vercel live demo link
- [x] Stellar Testnet contract IDs
- [x] Example transaction hash
- [ ] Mobile UI screenshot
- [ ] CI screenshot
- [ ] Test output screenshot
- [ ] Demo video link

## Known Limitations

- The frontend currently includes demo data fallback so the UI is reviewable before Testnet deployment.
- Generated TypeScript bindings should be added after real contract deployment.
- Token transfer escrow should be wired to a Stellar asset/token contract during the deployment hardening phase.
