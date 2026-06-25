# BitStarter Smart Contract Refactor Prompt

You are working inside the `BitStarter` monorepo.

BitStarter is currently a Stellar/Soroban preorder escrow platform, but the product model is changing into a **refund-protected investment crowdfunding platform**.

Your task is to refactor the smart contracts first. If the existing contracts are too tightly coupled to the old preorder model, rewrite the relevant contracts from scratch while keeping the monorepo structure clean and modular.

## Goal

Transform BitStarter from a simple preorder escrow system into a platform where:

1. A developer/founder creates an investment campaign.
2. Investors can invest into the campaign.
3. A configurable percentage of each investment becomes immediately usable by the developer.
4. The remaining percentage stays locked as a protected refund reserve.
5. When the project is marked finished or the funding deadline is reached, investors vote.
6. Voting power is proportional to invested amount, not wallet count.
7. If more than 50% of the invested capital approves the project, the developer can withdraw the remaining locked funds.
8. If the project is rejected, cancelled, or fails, investors can claim their protected refundable amount.
9. Double refunds, double voting, and unauthorized withdrawals must be prevented.

## Existing Repository Structure

Current structure:

```txt
contracts/shared
contracts/campaign_factory
contracts/preorder_campaign
contracts/refund_manager
```

You may keep these names if it is easier, but preferably refactor the contract naming toward the new model:

```txt
contracts/shared
contracts/campaign_factory
contracts/investment_campaign
contracts/refund_manager
```

If renaming is too disruptive, keep `preorder_campaign` but replace the internal logic with the new investment campaign model.

## High-Level Contract Responsibilities

### 1. `contracts/shared`

Update shared types, errors, event names, and constants.

It should include:

* Shared error enum
* Campaign status enum
* Vote choice enum
* Campaign metadata/data structs if useful
* Investor position struct if useful
* Event name constants

Recommended campaign statuses:

```rust
pub enum CampaignStatus {
    Active,
    VotingOpen,
    Approved,
    Rejected,
    Cancelled,
}
```

Recommended vote choices:

```rust
pub enum VoteChoice {
    Approve,
    Reject,
}
```

Recommended investor position fields:

```rust
pub struct InvestorPosition {
    pub total_invested: i128,
    pub refundable_amount: i128,
    pub usable_amount: i128,
    pub has_voted: bool,
    pub vote_choice: Option<VoteChoice>,
    pub refunded: bool,
}
```

Use Soroban-compatible types only.

### 2. `contracts/campaign_factory`

Refactor the factory so it deploys and indexes investment campaigns.

`CampaignFactory.initialize` should store:

* Admin address
* Investment campaign WASM hash
* Token contract address

`CampaignFactory.create_campaign` should deploy a new campaign and initialize it with:

* Developer/founder address
* Token contract address
* Title
* Description
* Metadata URI
* Funding goal
* Funding deadline
* Refund ratio
* Usable ratio
* Voting duration

Validation rules:

* Developer must authenticate.
* Funding goal must be positive.
* Deadline must be in the future.
* Refund ratio must be between 0 and 100.
* Usable ratio must be between 0 and 100.
* `refund_ratio + usable_ratio == 100`.
* Voting duration must be positive.
* Metadata fields should have reasonable limits if currently implemented.

Factory should store:

* All campaign addresses
* Campaigns by developer/founder
* Total campaign count

Expose read methods such as:

```rust
get_campaign(index)
get_campaign_count()
get_campaigns_by_developer(developer)
get_all_campaigns()
```

Emit event:

```txt
campaign_created
```

### 3. `contracts/investment_campaign`

This is the core contract.

It should manage:

* Campaign metadata
* Investment records
* Total invested amount
* Refund reserve pool
* Usable pool
* Developer withdrawals
* Voting state
* Approval/rejection power
* Finalization
* Investor refunds
* Developer final withdrawal

#### Campaign Initialization

Initialize with:

```txt
developer
token
title
description
metadata_uri
funding_goal
funding_deadline
refund_ratio
usable_ratio
voting_duration
```

Initial status:

```txt
Active
```

Store:

```txt
total_invested
total_refund_reserved
total_usable_allocated
total_usable_withdrawn
approval_power
rejection_power
voting_deadline
```

`voting_deadline` can be unset until voting opens.

#### invest / place_investment

Replace old `place_order` behavior with an investment function.

Recommended function name:

```rust
invest(env, investor: Address, amount: i128)
```

Behavior:

* Investor must authenticate.
* Campaign must be `Active`.
* Current ledger timestamp must be before or equal to funding deadline.
* Amount must be positive.
* Transfer tokens from investor to campaign contract.
* Split amount into:

  * `usable_amount = amount * usable_ratio / 100`
  * `refundable_amount = amount * refund_ratio / 100`
* Update investor position.
* Update total invested.
* Update total usable allocated.
* Update total refund reserved.
* Emit `investment_placed`.

If the same investor invests multiple times, accumulate their position.

Voting power must be based on total invested amount.

#### withdraw_available_funds

Recommended function:

```rust
withdraw_available_funds(env, developer: Address, amount: i128)
```

Behavior:

* Developer must authenticate.
* Caller must be the campaign developer.
* Campaign must be `Active` or `VotingOpen`.
* Amount must be positive.
* Developer can only withdraw from the usable pool.
* Never allow withdrawing from the refund reserve pool.
* Available amount:

```txt
total_usable_allocated - total_usable_withdrawn
```

* Transfer tokens from campaign contract to developer.
* Update `total_usable_withdrawn`.
* Emit `usable_funds_withdrawn`.

#### open_voting / mark_finished

Recommended function:

```rust
mark_finished(env, developer: Address)
```

Behavior:

* Developer must authenticate.
* Caller must be the campaign developer.
* Campaign must be `Active`.
* Set status to `VotingOpen`.
* Set `voting_deadline = current_timestamp + voting_duration`.
* Emit `voting_opened`.

Also implement a public function:

```rust
open_voting_after_deadline(env)
```

Behavior:

* Anyone can call it.
* Campaign must be `Active`.
* Current timestamp must be greater than funding deadline.
* Set status to `VotingOpen`.
* Set `voting_deadline = current_timestamp + voting_duration`.
* Emit `voting_opened`.

This is needed because Soroban contracts do not automatically execute when a deadline passes.

#### vote

Recommended function:

```rust
vote(env, investor: Address, choice: VoteChoice)
```

Behavior:

* Investor must authenticate.
* Campaign must be `VotingOpen`.
* Current timestamp must be before or equal to voting deadline.
* Investor must have invested more than 0.
* Investor must not have already voted.
* Voting power is investor total invested amount.
* If approve:

  * increase `approval_power`
* If reject:

  * increase `rejection_power`
* Mark investor as voted.
* Store vote choice.
* Emit `vote_cast`.

Do not use wallet count as voting power.

This is important for Sybil resistance.

#### finalize_campaign

Recommended function:

```rust
finalize_campaign(env)
```

Behavior:

* Anyone can call it.
* Campaign must be `VotingOpen`.
* Current timestamp must be greater than voting deadline.
* If `approval_power > total_invested / 2`, set status to `Approved`.
* Otherwise set status to `Rejected`.
* Emit `campaign_finalized`.

Important:

```txt
More than 50% of invested capital must approve.
```

Not 50% of voters.
Not wallet count.
Use invested capital weight.

#### withdraw_remaining_funds

Recommended function:

```rust
withdraw_remaining_funds(env, developer: Address)
```

Behavior:

* Developer must authenticate.
* Caller must be campaign developer.
* Campaign must be `Approved`.
* Transfer all remaining contract balance that is not already withdrawn to developer.
* Make sure this cannot be called twice.
* Emit `remaining_funds_withdrawn`.

After approval, investors should not be able to refund.

#### claim_refund

Recommended function:

```rust
claim_refund(env, investor: Address)
```

Behavior:

* Investor must authenticate.
* Campaign must be `Rejected` or `Cancelled`.
* Investor must have refundable amount greater than 0.
* Investor must not already be refunded.
* Transfer investor’s `refundable_amount` from campaign contract to investor.
* Mark investor as refunded.
* Emit `refund_claimed`.

Refund amount must only be the protected reserve portion, not the full investment.

#### cancel_campaign

Recommended function:

```rust
cancel_campaign(env, developer: Address)
```

Behavior:

* Developer must authenticate.
* Caller must be campaign developer.
* Campaign must be `Active` or `VotingOpen`.
* Set status to `Cancelled`.
* Emit `campaign_cancelled`.

After cancellation, investors can claim their refundable protected amount.

## Refund Manager

Review whether `refund_manager` is still necessary.

Preferred approach:

* If it adds unnecessary complexity, simplify or remove it from the main flow.
* Refund safety can live directly in `investment_campaign.claim_refund`.
* If keeping `refund_manager`, it must not duplicate state incorrectly.
* It should only coordinate refund claims if there is a clear reason.

Do not keep a redundant refund manager just because the old architecture had one.

## Events

Add or update events for the new investment lifecycle:

```txt
campaign_created
investment_placed
usable_funds_withdrawn
voting_opened
vote_cast
campaign_finalized
refund_claimed
remaining_funds_withdrawn
campaign_cancelled
```

Events should include useful identifiers such as:

* campaign address
* developer
* investor
* amount
* vote choice
* status
* timestamp if useful

## Required Tests

Update or rewrite Rust contract tests.

At minimum, add tests for:

### Campaign Creation

* Creates campaign with valid parameters.
* Rejects invalid funding goal.
* Rejects deadline in the past.
* Rejects invalid refund/usable ratios.
* Rejects when `refund_ratio + usable_ratio != 100`.

### Investment

* Investor can invest during active campaign.
* Investment transfers tokens to campaign.
* Investment splits correctly into usable and refundable portions.
* Multiple investments by the same investor accumulate correctly.
* Investment fails after deadline.
* Investment fails when campaign is not active.

### Developer Withdrawals

* Developer can withdraw only from usable pool.
* Developer cannot withdraw refund reserve.
* Non-developer cannot withdraw.
* Withdrawal updates `total_usable_withdrawn`.
* Double over-withdraw is prevented.

### Voting

* Developer can mark project finished and open voting.
* Anyone can open voting after funding deadline.
* Investor can vote once.
* Non-investor cannot vote.
* Voting power equals invested amount.
* Double voting is prevented.
* Voting after voting deadline fails.

### Finalization

* Campaign becomes `Approved` when approval power is greater than 50% of total invested.
* Campaign becomes `Rejected` when approval power is 50% or less.
* Finalization cannot happen before voting deadline.
* Finalization can be called by anyone.

### Refunds

* Investor can claim protected refund after rejection.
* Investor can claim protected refund after cancellation.
* Investor cannot claim refund after approval.
* Investor cannot claim more than refundable amount.
* Double refund is prevented.

### Final Developer Withdrawal

* Developer can withdraw remaining funds after approval.
* Non-developer cannot withdraw remaining funds.
* Remaining funds cannot be withdrawn twice.
* Investors cannot refund after approval.

## Backward Compatibility

Do not preserve the old preorder behavior if it conflicts with the new investment model.

It is acceptable to break existing frontend contract calls for now.

The priority is to make the smart contract layer correct, testable, and clean.

After this refactor, the frontend will be updated separately.

## Code Quality Requirements

* Keep the contracts modular and readable.
* Avoid overengineering.
* Use clear storage keys.
* Use explicit errors instead of panics where possible.
* Keep all authorization checks strict.
* Use Soroban token client correctly for transfers.
* Avoid duplicate source of truth across contracts.
* Add comments only where they clarify business logic or security-sensitive behavior.
* Make sure all contracts compile.
* Make sure all Rust contract tests pass.

## Deliverables

When finished, provide:

1. Summary of changed contracts.
2. New or changed public contract methods.
3. Important storage layout changes.
4. Removed or deprecated old preorder methods.
5. Test coverage summary.
6. Any remaining TODOs or risks.

Start by inspecting the current contract code, then implement the refactor in the smallest clean set of changes. If the old contracts are too incompatible with the new model, rewrite the campaign contract cleanly.
