# Build BitStarter — Trustless Preorder Platform on Stellar

You are an expert full-stack blockchain engineer. Build a production-ready project called **BitStarter**.

BitStarter is a trustless preorder platform for digital products, indie apps, SaaS tools, courses, games, and creator launches. Sellers can create preorder campaigns with a funding goal and deadline. Buyers can safely place preorders while funds are locked in escrow. If the campaign succeeds, the seller can withdraw the funds. If the campaign fails, buyers can claim refunds directly from the smart contract.

The project must be deployed on **Stellar Testnet using Stellar/Soroban smart contracts**, and the frontend must be deployed on **Vercel**.

Do not build this as an EVM/Solidity project. Use the Stellar smart contract ecosystem.

---

## Main Requirements

The final project must satisfy all of these requirements:

* Advanced smart contract development
* Inter-contract communication
* Event streaming and real-time frontend updates
* CI/CD pipeline setup
* Smart contract deployment workflow
* Mobile responsive frontend
* Error handling and loading states
* Tests for contracts and frontend
* Production-ready architecture practices
* Complete documentation and demo-ready project structure

Submission artifacts must include:

* Public GitHub repository
* Complete README
* Minimum 10+ meaningful commits
* Live demo link deployed on Vercel
* Stellar contract deployment address or contract IDs
* Transaction hash for at least one contract interaction
* Screenshots showing:

  * Mobile responsive UI
  * CI/CD pipeline running
  * Test output with 3+ passing tests
* Demo video link placeholder in README

---

# Tech Stack

Use the following stack unless there is a strong technical reason not to:

## Smart Contracts

* Stellar Soroban smart contracts
* Rust
* Stellar CLI
* Soroban SDK
* Stellar Testnet deployment
* Contract unit tests in Rust

## Frontend

* Next.js with TypeScript
* React
* Tailwind CSS
* Stellar JS SDK
* Responsive mobile-first UI
* Vercel deployment

## CI/CD

* GitHub Actions
* Run contract tests
* Run frontend lint/build/tests
* Optional: separate deploy workflow notes for contracts and frontend

---

# Project Architecture

Use a clean monorepo structure:

```txt
bitstarter/
  contracts/
    campaign_factory/
      src/
        lib.rs
      Cargo.toml
    preorder_campaign/
      src/
        lib.rs
      Cargo.toml
    refund_manager/
      src/
        lib.rs
      Cargo.toml
    shared/
      src/
        types.rs
        errors.rs
        events.rs
      Cargo.toml

  apps/
    web/
      app/
      components/
      features/
        campaigns/
        wallet/
        realtime/
      lib/
        stellar/
        contracts/
        validation/
      hooks/
      tests/
      public/
      package.json
      next.config.ts

  scripts/
    deploy/
      deploy-testnet.sh
      deploy-contracts.ts or deploy-contracts.js
    generate-bindings/
    seed-demo-data/

  docs/
    architecture.md
    deployment.md
    demo-flow.md
    screenshots/

  .github/
    workflows/
      ci.yml

  README.md
```

Keep the architecture modular. Do not put everything into a single file. Separate contract logic, frontend contract clients, hooks, validation, and UI components.

---

# Smart Contract Design

Implement at least 3 contracts to demonstrate inter-contract communication.

## 1. CampaignFactory Contract

Responsible for creating and tracking preorder campaigns.

Responsibilities:

* Create new preorder campaigns
* Store campaign contract IDs
* Store seller-to-campaign mapping
* Emit `campaign_created` event
* Optionally check seller registration or seller validity
* Provide read methods for campaign listing

Required functions:

```txt
initialize(admin)
create_campaign(seller, title, description, goal_amount, deadline, metadata_uri)
get_campaign(campaign_id)
get_all_campaigns()
get_campaigns_by_seller(seller)
```

Required events:

```txt
campaign_created
```

---

## 2. PreorderCampaign Contract

Responsible for campaign-specific logic.

Responsibilities:

* Store campaign details
* Accept buyer preorders
* Track buyer contributions
* Track total raised amount
* Determine campaign status
* Allow seller withdrawal only if goal is reached and deadline/conditions are valid
* Allow refunds if campaign failed
* Emit events for every important action

Required campaign states:

```txt
Active
Successful
Failed
Withdrawn
Cancelled
```

Required functions:

```txt
initialize(factory, seller, title, description, goal_amount, deadline, metadata_uri)
place_order(buyer, amount)
get_campaign_info()
get_buyer_order(buyer)
get_total_raised()
get_status()
mark_successful_if_goal_reached()
withdraw_funds(seller)
cancel_campaign(seller)
```

Required events:

```txt
order_placed
goal_reached
funds_withdrawn
campaign_cancelled
```

Important rules:

* A buyer cannot place a zero-value order.
* A buyer can place multiple orders, but their total contribution must be tracked.
* Only the seller can withdraw campaign funds.
* Seller cannot withdraw unless the campaign succeeds.
* Buyers cannot refund while the campaign is active and still valid.
* Use clear custom errors.
* Do not rely on frontend-only validation.

---

## 3. RefundManager Contract

Responsible for refund eligibility and refund execution.

Responsibilities:

* Communicate with the campaign contract
* Check whether the campaign failed, expired, or was cancelled
* Allow buyers to claim refunds
* Prevent double refunds
* Emit refund events

Required functions:

```txt
claim_refund(campaign_id, buyer)
is_refund_available(campaign_id, buyer)
has_claimed_refund(campaign_id, buyer)
```

Required events:

```txt
refund_claimed
```

Important rules:

* Refunds must only be claimable when campaign status allows it.
* A buyer cannot claim refund twice.
* A buyer cannot claim refund without an order.
* Keep refund logic modular and separate from the factory.

---

# Event Streaming and Real-Time Updates

The frontend must show real-time or near-real-time updates when blockchain events happen.

Implement an event listener layer in the frontend:

```txt
apps/web/features/realtime/
  useCampaignEvents.ts
  eventParser.ts
  eventTypes.ts
```

The UI should update when these events happen:

* Campaign created
* Order placed
* Goal reached
* Refund claimed
* Funds withdrawn
* Campaign cancelled

The frontend should show an activity feed, for example:

```txt
Live Activity
- New campaign created: Open Source AI Course
- 50 XLM preorder placed
- Goal reached for Indie Game Launch
- Refund claimed by buyer
```

If true websocket-based streaming is difficult on Stellar/Vercel, implement reliable polling against Stellar RPC/events with a clean abstraction. The README must clearly explain how real-time updates are implemented.

---

# Frontend Requirements

Build a clean, mobile-responsive frontend.

Pages:

## Home Page

* Project explanation
* CTA buttons:

  * Create Campaign
  * Explore Campaigns
* Short explanation of trustless preorder flow

## Campaign Listing Page

* Campaign cards
* Campaign status badges
* Goal amount
* Total raised
* Deadline
* Seller address
* Loading state
* Empty state
* Error state

## Campaign Detail Page

* Campaign title and description
* Funding progress bar
* Total raised / goal
* Deadline
* Status
* Buyer preorder form
* Refund button when eligible
* Seller withdraw button when eligible
* Live activity feed

## Create Campaign Page

* Form fields:

  * Title
  * Description
  * Goal amount
  * Deadline
  * Metadata URI
* Client-side validation
* Loading state during transaction
* Success state with transaction hash
* Error state with readable message

## Dashboard Page

* Seller campaigns
* Buyer orders
* Refundable campaigns
* Withdrawable campaigns

---

# Wallet and Stellar Integration

Implement a clean Stellar integration layer.

Suggested structure:

```txt
apps/web/lib/stellar/
  client.ts
  network.ts
  wallet.ts
  transactions.ts
  contractClient.ts
```

Requirements:

* Use Stellar Testnet configuration.
* Keep network config centralized.
* Store contract IDs in environment variables.
* Do not hardcode secrets.
* Public frontend values must use `NEXT_PUBLIC_` prefix.
* Example env variables:

```txt
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_FACTORY_CONTRACT_ID=
NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID=
```

Include `.env.example`.

The app should be designed to work on Vercel. Do not use local filesystem writes or server-only assumptions that break Vercel deployment.

---

# Backend / API Layer

This project does not need a heavy backend, but use a clean API structure if backend routes are needed.

Use Next.js API routes or server actions only for:

* Metadata validation
* Optional demo data
* Optional read aggregation
* Optional event polling helper

Do not put private keys into the Vercel frontend bundle.

If a deployer/admin private key is needed for scripts, keep it only in local `.env` or GitHub Actions secrets. Never expose it as `NEXT_PUBLIC_`.

---

# Tests

Implement meaningful tests.

## Contract Tests

Write Rust/Soroban contract tests for at least:

1. Seller can create a campaign through the factory.
2. Buyer can place preorder and total raised updates.
3. Seller cannot withdraw before goal is reached.
4. Seller can withdraw after goal is reached.
5. Buyer can claim refund when campaign fails or is cancelled.
6. Buyer cannot claim refund twice.

Minimum required passing tests: 3. Prefer 6+.

## Frontend Tests

Use Vitest and React Testing Library.

Test at least:

1. Campaign card renders title, goal, status.
2. Create campaign form validates empty fields.
3. Loading state appears during transaction.
4. Error message appears on failed transaction.

---

# CI/CD Requirements

Create GitHub Actions workflow:

```txt
.github/workflows/ci.yml
```

The workflow must:

* Install frontend dependencies
* Run frontend lint
* Run frontend tests
* Run frontend build
* Install Rust toolchain
* Run contract tests
* Build Soroban contracts if possible

The README must include a screenshot placeholder for the CI pipeline.

---

# Deployment Workflow

Document and implement deployment scripts.

## Stellar Testnet Contract Deployment

Create scripts and docs for:

1. Install Stellar CLI.
2. Configure Stellar Testnet.
3. Generate or configure deployer identity.
4. Fund deployer using Stellar Testnet friendbot if needed.
5. Build contracts.
6. Deploy contracts to Stellar Testnet.
7. Save deployed contract IDs.
8. Update frontend `.env` values.
9. Run at least one contract interaction.
10. Save transaction hash for submission.

The deployment docs must be written so another developer can reproduce the deployment.

## Vercel Frontend Deployment

Document:

1. Push repo to GitHub.
2. Import `apps/web` project into Vercel.
3. Set environment variables:

   * `NEXT_PUBLIC_STELLAR_NETWORK`
   * `NEXT_PUBLIC_STELLAR_RPC_URL`
   * `NEXT_PUBLIC_FACTORY_CONTRACT_ID`
   * `NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID`
4. Build command.
5. Output directory.
6. Live demo link.

Make sure the Next.js app can build successfully on Vercel.

---

# Error Handling

Implement readable errors for:

* Wallet not connected
* Wrong network
* Invalid goal amount
* Invalid deadline
* Transaction rejected
* Transaction failed
* Contract call failed
* RPC unavailable
* Campaign not found
* Refund not available
* Withdraw not allowed

Use shared frontend error helpers:

```txt
apps/web/lib/errors/
  parseStellarError.ts
  userFriendlyErrors.ts
```

---

# Loading States

Implement loading states for:

* Loading campaign list
* Loading campaign details
* Creating campaign
* Placing preorder
* Claiming refund
* Withdrawing funds
* Waiting for transaction confirmation
* Loading live activity feed

---

# Production-Ready Practices

Follow these rules:

* Use TypeScript strictly in the frontend.
* Use Rust modules cleanly in contracts.
* Use custom contract errors.
* Avoid duplicated logic.
* Add comments only where they clarify complex logic.
* Keep UI components reusable.
* Keep blockchain calls isolated from UI components.
* Use environment variables for deployed contract IDs.
* Add `.env.example`.
* Add README sections for setup, testing, deployment, and demo.
* Add screenshots folder with placeholders.
* Add demo video link placeholder.
* Make at least 10 meaningful commits during development.

---

# README Requirements

The README must include:

```txt
# BitStarter

## Overview
## Problem
## Solution
## Features
## Architecture
## Smart Contracts
## Inter-Contract Communication
## Event Streaming / Real-Time Updates
## Tech Stack
## Local Setup
## Environment Variables
## Running Tests
## Stellar Testnet Deployment
## Vercel Deployment
## Contract Addresses / IDs
## Example Transaction Hash
## Screenshots
## Demo Video
## Submission Checklist
```

Also include a short explanation:

```txt
BitStarter uses Stellar/Soroban smart contracts to create a trustless preorder escrow system. Campaign funds are locked until the campaign reaches its funding goal. If the campaign fails or is cancelled, buyers can claim refunds without trusting the seller.
```

---

# Demo Flow

Prepare the app so the demo video can show this flow in 1–2 minutes:

1. Open BitStarter live Vercel URL.
2. Connect Stellar testnet wallet or use configured testnet account flow.
3. Create a preorder campaign.
4. Show the new campaign appearing in the campaign list.
5. Place a preorder.
6. Show funding progress updating.
7. Show live activity feed updating from contract events.
8. Trigger successful campaign state or show refund path.
9. Show transaction hash.
10. Show GitHub Actions CI passing.
11. Show test output with at least 3 passing tests.

---

# Important Implementation Notes

* This is a Stellar/Soroban project, not an Ethereum/Solidity project.
* Use Rust contracts compiled to Wasm.
* Use Stellar CLI for contract build/deploy workflow.
* Use Stellar Testnet.
* Use Stellar JS SDK or generated TypeScript bindings for frontend contract interaction.
* Make sure frontend deployment works on Vercel.
* Keep contract IDs configurable through environment variables.
* Do not expose private keys in frontend code.
* Do not build a fake-only frontend. It must interact with deployed Stellar Testnet contracts.
* If some wallet integration is difficult, provide a clean testnet interaction abstraction and document exactly how transactions are signed/submitted.
* Prioritize a working, demo-ready, production-style MVP over unnecessary features.

---

# Final Deliverable

When finished, provide:

1. Project summary
2. Local setup commands
3. Test commands
4. Stellar deployment commands
5. Vercel deployment instructions
6. Contract IDs
7. Example transaction hash
8. List of completed requirements
9. Any known limitations
10. Suggested next improvements
