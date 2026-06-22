extern crate std;

use super::*;
use preorder_campaign::PreorderCampaignClient;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

const PREORDER_CAMPAIGN_WASM: &[u8] =
    include_bytes!("../../../target/wasm32v1-none/release/preorder_campaign.wasm");

#[test]
fn seller_can_create_campaign_through_factory() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let contract_id = env.register(CampaignFactory, ());
    let client = CampaignFactoryClient::new(&env, &contract_id);
    let campaign_wasm_hash = env.deployer().upload_contract_wasm(PREORDER_CAMPAIGN_WASM);

    client.initialize(&admin, &campaign_wasm_hash);
    let campaign_id = client.create_campaign(
        &seller,
        &String::from_str(&env, "Open Source AI Course"),
        &String::from_str(&env, "Course preorder"),
        &500,
        &2_000_u64,
        &String::from_str(&env, "ipfs://course"),
    );

    let summary = client.get_campaign(&0);
    assert_eq!(summary.id, campaign_id);
    assert_eq!(summary.title, String::from_str(&env, "Open Source AI Course"));
    assert_eq!(client.get_campaigns_by_seller(&seller).len(), 1);

    let campaign = PreorderCampaignClient::new(&env, &campaign_id);
    let info = campaign.get_campaign_info();
    assert_eq!(info.seller, seller);
    assert_eq!(info.goal_amount, 500);
}
