extern crate std;

use super::*;
use bitstarter_shared::types::{VOTE_APPROVE, VOTE_REJECT};
use escrow::{Escrow, EscrowClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env, String,
};

fn setup() -> (
    Env,
    InvestmentCampaignClient<'static>,
    Address,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let developer = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let escrow_id = env.register(Escrow, ());
    let escrow = EscrowClient::new(&env, &escrow_id);
    escrow.initialize(&token_admin, &token);
    let contract_id = env.register(InvestmentCampaign, ());
    let client = InvestmentCampaignClient::new(&env, &contract_id);
    client.initialize(
        &developer,
        &escrow_id,
        &String::from_str(&env, "Demo"),
        &String::from_str(&env, "Demo campaign"),
        &String::from_str(&env, "ipfs://demo"),
        &1_000,
        &2_000_u64,
        &60_u32,
        &40_u32,
        &100_u64,
    );
    (env, client, developer, token_admin, token, escrow_id)
}

fn mint(env: &Env, token: &Address, investor: &Address, amount: i128) {
    StellarAssetClient::new(env, token).mint(investor, &amount);
}

#[test]
fn initializes_with_valid_parameters_and_rejects_invalid_inputs() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);
    let developer = Address::generate(&env);
    let _token = env
        .register_stellar_asset_contract_v2(Address::generate(&env))
        .address();
    let escrow_id = Address::generate(&env);
    let contract_id = env.register(InvestmentCampaign, ());
    let client = InvestmentCampaignClient::new(&env, &contract_id);

    assert!(client
        .try_initialize(
            &developer,
            &escrow_id,
            &String::from_str(&env, "Demo"),
            &String::from_str(&env, "Demo campaign"),
            &String::from_str(&env, "ipfs://demo"),
            &0,
            &2_000_u64,
            &60_u32,
            &40_u32,
            &100_u64,
        )
        .is_err());
    assert!(client
        .try_initialize(
            &developer,
            &escrow_id,
            &String::from_str(&env, "Demo"),
            &String::from_str(&env, "Demo campaign"),
            &String::from_str(&env, "ipfs://demo"),
            &1_000,
            &999_u64,
            &60_u32,
            &40_u32,
            &100_u64,
        )
        .is_err());
    assert!(client
        .try_initialize(
            &developer,
            &escrow_id,
            &String::from_str(&env, "Demo"),
            &String::from_str(&env, "Demo campaign"),
            &String::from_str(&env, "ipfs://demo"),
            &1_000,
            &2_000_u64,
            &70_u32,
            &40_u32,
            &100_u64,
        )
        .is_err());
}

#[test]
fn investor_can_invest_and_positions_accumulate() {
    let (env, client, _developer, _token_admin, token, escrow_id) = setup();
    let investor = Address::generate(&env);
    let token_client = TokenClient::new(&env, &token);
    mint(&env, &token, &investor, 100);

    client.invest(&investor, &25);
    client.invest(&investor, &75);

    let position = client.get_investor_position(&investor);
    assert_eq!(position.total_invested, 100);
    assert_eq!(position.refundable_amount, 60);
    assert_eq!(position.usable_amount, 40);
    assert_eq!(position.vote_choice, None);
    assert_eq!(client.get_total_invested(), 100);
    assert_eq!(client.get_total_refund_reserved(), 60);
    assert_eq!(client.get_total_usable_allocated(), 40);
    assert_eq!(token_client.balance(&investor), 0);
    assert_eq!(token_client.balance(&escrow_id), 100);
    assert_eq!(token_client.balance(&client.address), 0);
}

#[test]
fn investment_fails_after_deadline_or_when_not_active() {
    let (env, client, developer, _token_admin, token, _escrow_id) = setup();
    let investor = Address::generate(&env);
    mint(&env, &token, &investor, 100);

    env.ledger().with_mut(|ledger| ledger.timestamp = 2_001);
    assert!(client.try_invest(&investor, &10).is_err());

    env.ledger().with_mut(|ledger| ledger.timestamp = 1_500);
    client.mark_finished(&developer);
    assert!(client.try_invest(&investor, &10).is_err());
}

#[test]
fn developer_can_withdraw_only_usable_pool() {
    let (env, client, developer, _token_admin, token, escrow_id) = setup();
    let investor = Address::generate(&env);
    let stranger = Address::generate(&env);
    let token_client = TokenClient::new(&env, &token);
    mint(&env, &token, &investor, 100);
    client.invest(&investor, &100);

    assert!(client.try_withdraw_available_funds(&stranger, &1).is_err());
    assert!(client
        .try_withdraw_available_funds(&developer, &41)
        .is_err());

    client.withdraw_available_funds(&developer, &40);
    assert_eq!(client.get_total_usable_withdrawn(), 40);
    assert_eq!(token_client.balance(&developer), 40);
    assert_eq!(token_client.balance(&escrow_id), 60);
    assert_eq!(token_client.balance(&client.address), 0);
    assert!(client.try_withdraw_available_funds(&developer, &1).is_err());
}

#[test]
fn voting_uses_invested_amount_and_prevents_double_votes() {
    let (env, client, developer, _token_admin, token, _escrow_id) = setup();
    let small = Address::generate(&env);
    let large = Address::generate(&env);
    let outsider = Address::generate(&env);
    mint(&env, &token, &small, 40);
    mint(&env, &token, &large, 100);
    client.invest(&small, &40);
    client.invest(&large, &100);

    client.mark_finished(&developer);
    client.vote(&small, &VOTE_REJECT);
    client.vote(&large, &VOTE_APPROVE);

    assert_eq!(
        client.get_investor_position(&small).vote_choice,
        Some(VOTE_REJECT)
    );
    assert_eq!(
        client.get_investor_position(&large).vote_choice,
        Some(VOTE_APPROVE)
    );
    assert_eq!(client.get_rejection_power(), 40);
    assert_eq!(client.get_approval_power(), 100);
    assert!(client.try_vote(&small, &VOTE_APPROVE).is_err());
    assert!(client.try_vote(&outsider, &VOTE_APPROVE).is_err());

    env.ledger().with_mut(|ledger| ledger.timestamp = 1_601);
    assert!(client.try_vote(&large, &VOTE_APPROVE).is_err());
}

#[test]
fn anyone_can_open_voting_after_deadline() {
    let (env, client, _developer, _token_admin, _token, _escrow_id) = setup();
    env.ledger().with_mut(|ledger| ledger.timestamp = 2_001);

    client.open_voting_after_deadline();

    assert_eq!(client.get_status(), CampaignStatus::VotingOpen);
    assert_eq!(client.get_voting_deadline(), 2_101);
}

#[test]
fn finalization_requires_more_than_half_approval() {
    let (env, client, developer, _token_admin, token, _escrow_id) = setup();
    let investor_a = Address::generate(&env);
    let investor_b = Address::generate(&env);
    mint(&env, &token, &investor_a, 100);
    mint(&env, &token, &investor_b, 100);
    client.invest(&investor_a, &100);
    client.invest(&investor_b, &100);
    client.mark_finished(&developer);
    client.vote(&investor_a, &VOTE_APPROVE);

    assert!(client.try_finalize_campaign().is_err());
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_601);
    assert_eq!(client.finalize_campaign(), CampaignStatus::Rejected);
}

#[test]
fn majority_approval_allows_remaining_withdrawal_and_blocks_refunds() {
    let (env, client, developer, _token_admin, token, escrow_id) = setup();
    let investor_a = Address::generate(&env);
    let investor_b = Address::generate(&env);
    let token_client = TokenClient::new(&env, &token);
    mint(&env, &token, &investor_a, 70);
    mint(&env, &token, &investor_b, 30);
    client.invest(&investor_a, &70);
    client.invest(&investor_b, &30);
    client.withdraw_available_funds(&developer, &40);
    client.mark_finished(&developer);
    client.vote(&investor_a, &VOTE_APPROVE);

    env.ledger().with_mut(|ledger| ledger.timestamp = 1_601);
    assert_eq!(client.finalize_campaign(), CampaignStatus::Approved);
    assert_eq!(client.withdraw_remaining_funds(&developer), 60);
    assert_eq!(token_client.balance(&developer), 100);
    assert_eq!(token_client.balance(&escrow_id), 0);
    assert_eq!(token_client.balance(&client.address), 0);
    assert!(client.try_withdraw_remaining_funds(&developer).is_err());
    assert!(client.try_claim_refund(&investor_a).is_err());
}

#[test]
fn rejection_or_cancellation_allows_protected_refund_only_once() {
    let (env, client, developer, _token_admin, token, escrow_id) = setup();
    let investor = Address::generate(&env);
    let token_client = TokenClient::new(&env, &token);
    mint(&env, &token, &investor, 100);
    client.invest(&investor, &100);
    client.withdraw_available_funds(&developer, &40);
    client.cancel_campaign(&developer);

    assert_eq!(client.claim_refund(&investor), 60);
    assert_eq!(token_client.balance(&investor), 60);
    assert_eq!(token_client.balance(&escrow_id), 0);
    assert_eq!(token_client.balance(&client.address), 0);
    assert!(client.try_claim_refund(&investor).is_err());
}
