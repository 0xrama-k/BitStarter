# BitStarter

## Overview

BitStarter uses Stellar/Soroban smart contracts to create a refund-protected investment crowdfunding system. A configurable share of each investment is usable by the developer, while the protected reserve can be refunded if the project is rejected or cancelled.

## Problem

Early software projects often require investors to trust a developer before the product exists. Developers also need a clear way to access staged funding while giving investors refund protection.

## Solution

BitStarter lets developers create investment campaigns with a goal, deadline, refund ratio, usable ratio, and voting duration. Investors fund campaigns through Stellar Testnet contracts, vote with power proportional to invested capital, and can claim the protected reserve if a campaign is rejected or cancelled.

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
  escrow/
  campaign_factory/
  investment_campaign/
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

- `CampaignFactory`: initializes an admin, creates campaign records, tracks all campaigns, stores developer-to-campaign mappings, and passes the shared escrow address into each campaign.
- `Escrow`: holds token custody for campaign investments. Investors deposit into escrow, and campaign contracts authorize releases to creators or investors.
- `InvestmentCampaign`: tracks campaign metadata, investor positions, usable funds, refund reserves, weighted voting, final withdrawal, cancellation, and escrow release rules.
- `RefundManager`: optional compatibility wrapper that delegates refund claims to the campaign contract; the campaign remains the refund source of truth.

## Inter-Contract Communication

`RefundManager` creates an `InvestmentCampaign` client for the target campaign contract and delegates to `claim_refund`. Refund state and refund events are owned by the campaign contract.

## Event Streaming / Real-Time Updates

Contracts emit events for campaign creation, investments, usable withdrawals, voting, finalization, refunds, remaining withdrawals, and cancellations. The frontend keeps all realtime logic in `apps/web/features/realtime`. The current Vercel-safe implementation uses polling with a parser abstraction; after deployment, wire the poller to Stellar RPC event responses for the configured contract IDs.

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
NEXT_PUBLIC_FACTORY_CONTRACT_ID=CC56AKO3H3FJS3O6C4MKJK4QTHPXLZQMUPVRVZUXRYPYMO65AD3LNVUL
NEXT_PUBLIC_ESCROW_CONTRACT_ID=CCXUWIED3RKTFDZQH75D7BMG2N73VNNYQZSCX6KCAHIPRSPROOXTIXH7
NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID=CBXSHHMMQSNX35R6BEHBT63I2BQEJFIBLKW5NMEC4ZNR4OQDO5YGWOXY
NEXT_PUBLIC_INVESTMENT_CAMPAIGN_WASM_HASH=ed27f0f147d633bf29f4e5e37c119b24c62fce499447b5b2ee0392e1516bf69b
NEXT_PUBLIC_XLM_TOKEN_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
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

- CampaignFactory: `CC56AKO3H3FJS3O6C4MKJK4QTHPXLZQMUPVRVZUXRYPYMO65AD3LNVUL`
- Escrow: `CCXUWIED3RKTFDZQH75D7BMG2N73VNNYQZSCX6KCAHIPRSPROOXTIXH7`
- RefundManager: `CBXSHHMMQSNX35R6BEHBT63I2BQEJFIBLKW5NMEC4ZNR4OQDO5YGWOXY`
- InvestmentCampaign Wasm hash: `ed27f0f147d633bf29f4e5e37c119b24c62fce499447b5b2ee0392e1516bf69b`
- Demo InvestmentCampaign: `CATHURPCMY4ECYK3UDQSRZIEECQFZWGNI5R3RLBLDWHUBVU7S2VSVJEM`

## Example Transaction Hash

Real campaign creation: `10a187e3fc2b2e0f7b1fec4b0bd1bb88c20268f56a4fd6c3c179ed6dbd50bea6`

Verified escrow investment: `1c1243c43e27c645d16348cae02ee5cc63f596f442b0502b382b8033c77f80c6`

Explorer: `https://stellar.expert/explorer/testnet/tx/10a187e3fc2b2e0f7b1fec4b0bd1bb88c20268f56a4fd6c3c179ed6dbd50bea6`

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
- Campaign funds are now held by the dedicated `Escrow` contract; redeploy factory, escrow, campaign WASM, and refund manager together before retesting Testnet flows.
