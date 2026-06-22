extern crate std;

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, String};

#[test]
fn seller_can_create_campaign_through_factory() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let contract_id = env.register(CampaignFactory, ());
    let client = CampaignFactoryClient::new(&env, &contract_id);

    client.initialize(&admin);
    let id = client.create_campaign(
        &seller,
        &String::from_str(&env, "Open Source AI Course"),
        &String::from_str(&env, "Course preorder"),
        &500,
        &2_000_u64,
        &String::from_str(&env, "ipfs://course"),
    );

    let campaign = client.get_campaign(&id);
    assert_eq!(campaign.title, String::from_str(&env, "Open Source AI Course"));
    assert_eq!(client.get_campaigns_by_seller(&seller).len(), 1);
}
