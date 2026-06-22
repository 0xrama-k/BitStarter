extern crate std;

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, String};

fn setup(goal: i128) -> (Env, PreorderCampaignClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let factory = Address::generate(&env);
    let seller = Address::generate(&env);
    let contract_id = env.register(PreorderCampaign, ());
    let client = PreorderCampaignClient::new(&env, &contract_id);
    client.initialize(
        &factory,
        &seller,
        &String::from_str(&env, "Demo"),
        &String::from_str(&env, "Demo campaign"),
        &goal,
        &2_000_u64,
        &String::from_str(&env, "ipfs://demo"),
    );
    (env, client, seller, Address::generate(&Env::default()))
}

#[test]
fn buyer_can_place_preorder_and_total_updates() {
    let (env, client, _seller, _) = setup(100);
    let buyer = Address::generate(&env);

    client.place_order(&buyer, &25);
    client.place_order(&buyer, &15);

    assert_eq!(client.get_buyer_order(&buyer), 40);
    assert_eq!(client.get_total_raised(), 40);
}

#[test]
fn seller_cannot_withdraw_before_goal_is_reached() {
    let (env, client, seller, _) = setup(100);
    let buyer = Address::generate(&env);

    client.place_order(&buyer, &50);

    assert!(client.try_withdraw_funds(&seller).is_err());
}

#[test]
fn seller_can_withdraw_after_goal_is_reached() {
    let (env, client, seller, _) = setup(100);
    let buyer = Address::generate(&env);

    client.place_order(&buyer, &100);

    assert_eq!(client.withdraw_funds(&seller), 100);
    assert_eq!(client.get_status(), CampaignStatus::Withdrawn);
}

#[test]
fn campaign_can_be_cancelled_by_seller() {
    let (_env, client, seller, _) = setup(100);

    client.cancel_campaign(&seller);

    assert_eq!(client.get_status(), CampaignStatus::Cancelled);
}
