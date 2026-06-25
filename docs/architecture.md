# Architecture

BitStarter is a monorepo with Soroban contracts and a Vercel-ready Next.js app.

The contract layer is split into:

- `campaign_factory`: creates and indexes campaigns.
- `investment_campaign`: stores investor positions, usable funds, refund reserves, voting, settlement, and cancellation.
- `refund_manager`: optional wrapper that delegates refund claims to campaign contracts without duplicating refund state.
- `shared`: reusable errors, event names, and contract data types.

The frontend isolates Stellar access in `apps/web/lib/stellar` and contract-facing methods in `apps/web/lib/contracts`. UI pages consume those abstractions instead of constructing blockchain calls directly.

Realtime updates are handled through `apps/web/features/realtime`. The current implementation uses a polling abstraction so it can run reliably on Vercel. The same parser can be wired to Stellar RPC event responses after contract IDs are deployed.
