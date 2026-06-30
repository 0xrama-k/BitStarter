# BitStarter

## Overview

BitStarter is a Stellar/Soroban crowdfunding app for refund-protected software investment campaigns. Campaign creators define a funding goal, deadline, refund reserve, usable-funds share, and voting duration. Investors fund campaigns on Stellar Testnet, while each investment is split between developer-usable funds and a protected reserve.

If a campaign is rejected or cancelled, investors can claim the protected reserve. If investors approve the campaign after voting, the creator can withdraw the remaining reserved funds.

## Current State

The project is a working monorepo with Soroban contracts, a Next.js frontend, tests, and Testnet deployment configuration.

Implemented today:

- Rust Soroban contracts for campaign factory, escrow custody, investment campaign logic, refund management, and shared types/events.
- Campaign creation through the frontend with validation for goal, deadline, refund ratio, usable ratio, and voting duration.
- Campaign listing, detail pages, dashboard metrics, funding progress, and user-facing status labels.
- Live Stellar Testnet reads for campaign summaries, campaign details, totals invested, usable allocation, and usable withdrawals.
- Wallet connection UI for Freighter, Albedo, and a read-only demo session.
- Investment transactions through connected Stellar wallets.
- Refund claims through the refund manager.
- Creator-only UI visibility for usable and remaining withdrawal buttons.
- Developer withdrawal calls for usable funds and approved remaining funds.
- Status badge display rules:
  - `Goal reached` when funding has reached the goal but the campaign is still not completed.
  - `Completed` when the campaign contract status is `Approved`.
- Event/activity feed abstraction under `apps/web/features/realtime`.
- Frontend unit tests with Vitest and React Testing Library.
- Contract tests for investment accumulation, usable withdrawals, voting, finalization, refunds, cancellation, escrow custody, and factory creation.
- GitHub Actions CI configuration for frontend and contract checks.

## Product Flow

1. A creator connects a wallet and creates a campaign.
2. Investors open the campaign and invest XLM on Stellar Testnet.
3. The campaign contract splits each investment into:
   - developer-usable funds
   - protected refundable reserve
4. The creator can withdraw only the available usable pool while the campaign is active or voting is open.
5. After the campaign reaches voting/finalization conditions, investors vote with power proportional to invested capital.
6. If approved, the campaign is shown as completed and the creator can withdraw the remaining reserve.
7. If rejected or cancelled, investors can claim protected refunds.

## Architecture

```txt
contracts/
  campaign_factory/
  escrow/
  investment_campaign/
  refund_manager/
  shared/
apps/web/
  app/
  components/
  features/
    campaigns/
    realtime/
    wallet/
  lib/
    contracts/
    errors/
    stellar/
    validation/
scripts/
docs/
```

See [docs/architecture.md](docs/architecture.md) for more detail.

## Smart Contracts

- `CampaignFactory`: initializes an admin, creates campaign records, deploys/initializes campaign contracts, tracks all campaigns, stores developer-to-campaign mappings, and passes the shared escrow address into each campaign.
- `Escrow`: holds token custody for campaign investments. Investors deposit into escrow, and campaign contracts authorize releases to creators or investors.
- `InvestmentCampaign`: stores campaign metadata, investor positions, usable funds, refund reserves, weighted voting, finalization, cancellation, and escrow release rules.
- `RefundManager`: compatibility wrapper that delegates refund claims to the campaign contract. The campaign remains the refund source of truth.
- `shared`: reusable contract errors, event definitions, and shared data types.

## Frontend

The web app lives in `apps/web` and uses Next.js, React, TypeScript, Tailwind CSS, Stellar JS SDK, and Freighter APIs.

Key frontend areas:

- `features/campaigns`: campaign cards, create form, and transaction actions.
- `features/wallet`: wallet provider selection and session state.
- `features/realtime`: activity feed and event parser abstraction.
- `lib/contracts/campaignClient.ts`: contract simulation and transaction submission methods.
- `lib/stellar`: network, wallet, client, and transaction helpers.
- `lib/validation`: campaign form validation schemas.

The app currently uses direct Stellar SDK contract calls rather than generated TypeScript bindings.

## Status Labels

The contract status values remain:

- `Active`
- `VotingOpen`
- `Approved`
- `Rejected`
- `Cancelled`

The UI maps them to clearer product labels where needed:

- `Active` with funding below goal: `Active`
- `Active` or `VotingOpen` with funding at or above goal: `Goal reached`
- `VotingOpen` below goal: `Voting open`
- `Approved`: `Completed`
- `Rejected`: `Rejected`
- `Cancelled`: `Cancelled`

## Environment Variables

Create `apps/web/.env.local` from `apps/web/.env.example`:

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

## Local Setup

```bash
git clone https://github.com/your-org/bitstarter.git
cd bitstarter/apps/web
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

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
rustup target add wasm32v1-none
cargo build --workspace --target wasm32v1-none --release
```

## Stellar Testnet Deployment

```bash
rustup target add wasm32v1-none
stellar keys generate bitstarter-deployer --network testnet
stellar keys fund bitstarter-deployer --network testnet
STELLAR_SOURCE=bitstarter-deployer ./scripts/deploy/deploy-testnet.sh
```

Copy the printed contract IDs into `apps/web/.env.local` and Netlify environment variables.

## Current Testnet Deployment

- Network: Stellar Testnet
- CampaignFactory: `CC56AKO3H3FJS3O6C4MKJK4QTHPXLZQMUPVRVZUXRYPYMO65AD3LNVUL`
- Escrow: `CCXUWIED3RKTFDZQH75D7BMG2N73VNNYQZSCX6KCAHIPRSPROOXTIXH7`
- RefundManager: `CBXSHHMMQSNX35R6BEHBT63I2BQEJFIBLKW5NMEC4ZNR4OQDO5YGWOXY`
- InvestmentCampaign Wasm hash: `ed27f0f147d633bf29f4e5e37c119b24c62fce499447b5b2ee0392e1516bf69b`
- XLM token contract: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- Demo InvestmentCampaign: `CATHURPCMY4ECYK3UDQSRZIEECQFZWGNI5R3RLBLDWHUBVU7S2VSVJEM`
- Demo campaign creation transaction hash: `10a187e3fc2b2e0f7b1fec4b0bd1bb88c20268f56a4fd6c3c179ed6dbd50bea6`
- Demo escrow investment transaction hash: `1c1243c43e27c645d16348cae02ee5cc63f596f442b0502b382b8033c77f80c6`

Explorer example:

```txt
https://stellar.expert/explorer/testnet/tx/10a187e3fc2b2e0f7b1fec4b0bd1bb88c20268f56a4fd6c3c179ed6dbd50bea6
```

## Netlify Deployment

1. Push this repository to GitHub.
2. Import it into Netlify.
3. Use the root `netlify.toml` configuration.
4. Set the environment variables listed above.
5. Deploy.

Live demo link: `TODO`

## Remaining TODO

- Add frontend controls for voting, opening voting after the deadline, finalizing campaigns, and creator cancellation. The contracts support these flows, but the current UI mostly exposes invest, refund, and withdrawal actions.
- Replace the polling placeholder in `features/realtime` with real Stellar RPC event retrieval for the configured factory/campaign contract IDs.
- Add investor position UI: invested amount, refundable amount, usable allocation, vote status, and refund eligibility.
- Add clearer transaction lifecycle UX: pending, submitted, confirmed, failed, and explorer links for each successful transaction.
- Add generated TypeScript bindings or another typed contract client layer to reduce manual ScVal/native conversion code in `campaignClient.ts`.
- Add end-to-end tests against a local or Testnet-like Soroban environment for full create/invest/vote/finalize/refund flows.
- Add screenshots for mobile UI, CI output, and test output.
- Add the Netlify live demo link.
- Add a demo video link.
- Confirm and document the final public GitHub repository URL.
- Re-run and document a fresh full Testnet demo after the next contract redeploy, especially escrow-backed invest, usable withdrawal, final withdrawal, and refund paths.

## Known Limitations

- The frontend depends on configured Testnet contract IDs and a funded read source account for contract simulations.
- Wallet session state is frontend-only and used for UI visibility. Contract authorization remains the source of truth for creator-only operations.
- The activity feed currently uses an abstraction suitable for polling, but is not yet wired to real Stellar RPC event pages.
- Campaign completion is represented by the contract status `Approved`; the frontend displays this as `Completed`.
- The app has unit coverage, but not full browser E2E coverage for wallet and transaction flows.

## Submission Checklist

- [ ] Public GitHub repository URL
- [ ] 10+ meaningful commits
- [ ] Netlify live demo link
- [x] Stellar Testnet contract IDs
- [x] Example transaction hashes
- [ ] Mobile UI screenshot
- [ ] CI screenshot
- [ ] Test output screenshot
- [ ] Demo video link
