extern crate std;

use super::*;
use escrow::{Escrow, EscrowClient};
use investment_campaign::{InvestmentCampaign, InvestmentCampaignClient};
use soroban_sdk::{
    testutils::{Address as _, Events, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env, String, Symbol, TryFromVal, Val,
};

fn count_refund_events(env: &Env) -> u32 {
    env.events()
        .all()
        .iter()
        .filter(|(_, topics, _)| {
            let first: Val = topics.get(0).unwrap();
            Symbol::try_from_val(env, &first).unwrap() == Symbol::new(env, "refund_claimed")
        })
        .count() as u32
}

#[test]
fn investor_can_claim_protected_refund_when_campaign_is_cancelled() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let developer = Address::generate(&env);
    let investor = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env
        .register_stellar_asset_contract_v2(token_admin.clone())
        .address();
    let escrow_id = env.register(Escrow, ());
    let escrow = EscrowClient::new(&env, &escrow_id);
    escrow.initialize(&token_admin, &token);
    let campaign_id = env.register(InvestmentCampaign, ());
    let campaign = InvestmentCampaignClient::new(&env, &campaign_id);
    campaign.initialize(
        &developer,
        &escrow_id,
        &String::from_str(&env, "Demo"),
        &String::from_str(&env, "Demo campaign"),
        &String::from_str(&env, "ipfs://demo"),
        &100,
        &2_000_u64,
        &60_u32,
        &40_u32,
        &100_u64,
    );
    StellarAssetClient::new(&env, &token).mint(&investor, &100);
    campaign.invest(&investor, &100);
    campaign.withdraw_available_funds(&developer, &40);
    campaign.cancel_campaign(&developer);

    let refund_id = env.register(RefundManager, ());
    let refund = RefundManagerClient::new(&env, &refund_id);

    assert!(refund.is_refund_available(&campaign_id, &investor));
    let refund_events_before_refund = count_refund_events(&env);
    assert_eq!(refund.claim_refund(&campaign_id, &investor), 60);
    assert_eq!(count_refund_events(&env), refund_events_before_refund + 1);
    assert!(refund.has_claimed_refund(&campaign_id, &investor));
    assert_eq!(TokenClient::new(&env, &token).balance(&investor), 60);
    assert_eq!(TokenClient::new(&env, &token).balance(&escrow_id), 0);
    assert_eq!(TokenClient::new(&env, &token).balance(&campaign_id), 0);
    assert!(refund.try_claim_refund(&campaign_id, &investor).is_err());
}
