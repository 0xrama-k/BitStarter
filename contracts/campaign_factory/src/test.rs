extern crate std;

use super::*;
use escrow::{Escrow, EscrowClient};
use investment_campaign::InvestmentCampaignClient;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

const INVESTMENT_CAMPAIGN_WASM: &[u8] =
    include_bytes!("../../../target/wasm32v1-none/release/investment_campaign.wasm");

fn setup() -> (
    Env,
    CampaignFactoryClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let admin = Address::generate(&env);
    let token = env
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    let escrow_id = env.register(Escrow, ());
    let escrow = EscrowClient::new(&env, &escrow_id);
    escrow.initialize(&admin, &token);
    let contract_id = env.register(CampaignFactory, ());
    let client = CampaignFactoryClient::new(&env, &contract_id);
    let campaign_wasm_hash = env
        .deployer()
        .upload_contract_wasm(INVESTMENT_CAMPAIGN_WASM);

    client.initialize(&admin, &campaign_wasm_hash, &token, &escrow_id);
    (env, client, admin, token, escrow_id)
}

#[test]
fn developer_can_create_campaign_through_factory() {
    let (env, client, _admin, token, escrow_id) = setup();
    let developer = Address::generate(&env);

    let campaign_id = client.create_campaign(
        &developer,
        &String::from_str(&env, "Open Source AI Course"),
        &String::from_str(&env, "Investment campaign"),
        &String::from_str(&env, "ipfs://course"),
        &500,
        &2_000_u64,
        &60_u32,
        &40_u32,
        &100_u64,
    );

    let summary = client.get_campaign(&0);
    assert_eq!(summary.id, campaign_id);
    assert_eq!(summary.developer, developer);
    assert_eq!(summary.funding_goal, 500);
    assert_eq!(client.get_campaign_count(), 1);
    assert_eq!(client.get_all_campaigns().len(), 1);
    assert_eq!(client.get_campaigns_by_developer(&developer).len(), 1);

    let campaign = InvestmentCampaignClient::new(&env, &campaign_id);
    let info = campaign.get_campaign_info();
    assert_eq!(info.developer, developer);
    assert_eq!(info.token, token);
    assert_eq!(info.escrow, escrow_id);
    assert_eq!(info.funding_goal, 500);
    assert_eq!(info.refund_ratio, 60);
    assert_eq!(info.usable_ratio, 40);
}

#[test]
fn factory_rejects_invalid_campaign_parameters() {
    let (env, client, _admin, _token, _escrow_id) = setup();
    let developer = Address::generate(&env);
    let title = String::from_str(&env, "Demo");
    let description = String::from_str(&env, "Demo campaign");
    let metadata_uri = String::from_str(&env, "ipfs://demo");

    assert!(client
        .try_create_campaign(
            &developer,
            &title,
            &description,
            &metadata_uri,
            &0,
            &2_000_u64,
            &60_u32,
            &40_u32,
            &100_u64,
        )
        .is_err());
    assert!(client
        .try_create_campaign(
            &developer,
            &title,
            &description,
            &metadata_uri,
            &100,
            &999_u64,
            &60_u32,
            &40_u32,
            &100_u64,
        )
        .is_err());
    assert!(client
        .try_create_campaign(
            &developer,
            &title,
            &description,
            &metadata_uri,
            &100,
            &2_000_u64,
            &60_u32,
            &30_u32,
            &100_u64,
        )
        .is_err());
    assert!(client
        .try_create_campaign(
            &developer,
            &title,
            &description,
            &metadata_uri,
            &100,
            &2_000_u64,
            &101_u32,
            &0_u32,
            &100_u64,
        )
        .is_err());
}
