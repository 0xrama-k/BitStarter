extern crate std;

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

fn setup() -> (Env, EscrowClient<'static>, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token = env
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    let escrow_id = env.register(Escrow, ());
    let escrow = EscrowClient::new(&env, &escrow_id);
    escrow.initialize(&admin, &token);
    (env, escrow, admin, token, escrow_id)
}

#[test]
fn investor_deposits_and_campaign_releases_funds() {
    let (env, escrow, _admin, token, escrow_id) = setup();
    let campaign = Address::generate(&env);
    let investor = Address::generate(&env);
    let creator = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&investor, &100);

    escrow.deposit(&campaign, &investor, &100);
    assert_eq!(escrow.get_campaign_balance(&campaign), 100);
    assert_eq!(escrow.get_total_deposited(&campaign), 100);
    assert_eq!(TokenClient::new(&env, &token).balance(&escrow_id), 100);

    escrow.release(&campaign, &creator, &40);
    assert_eq!(escrow.get_campaign_balance(&campaign), 60);
    assert_eq!(escrow.get_total_released(&campaign), 40);
    assert_eq!(TokenClient::new(&env, &token).balance(&creator), 40);
}

#[test]
fn release_cannot_exceed_campaign_balance() {
    let (env, escrow, _admin, token, _escrow_id) = setup();
    let campaign = Address::generate(&env);
    let investor = Address::generate(&env);
    let creator = Address::generate(&env);
    StellarAssetClient::new(&env, &token).mint(&investor, &25);
    escrow.deposit(&campaign, &investor, &25);

    assert!(escrow.try_release(&campaign, &creator, &26).is_err());
}
