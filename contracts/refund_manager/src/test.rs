extern crate std;

use super::*;
use preorder_campaign::{PreorderCampaign, PreorderCampaignClient};
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, String};

#[test]
fn buyer_can_claim_refund_when_campaign_is_cancelled() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let factory = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);
    let campaign_id = env.register(PreorderCampaign, ());
    let campaign = PreorderCampaignClient::new(&env, &campaign_id);
    campaign.initialize(
        &factory,
        &seller,
        &String::from_str(&env, "Demo"),
        &String::from_str(&env, "Demo campaign"),
        &100,
        &2_000_u64,
        &String::from_str(&env, "ipfs://demo"),
    );
    campaign.place_order(&buyer, &25);
    campaign.cancel_campaign(&seller);

    let refund_id = env.register(RefundManager, ());
    let refund = RefundManagerClient::new(&env, &refund_id);

    assert!(refund.is_refund_available(&campaign_id, &buyer));
    assert_eq!(refund.claim_refund(&campaign_id, &buyer), 25);
    assert!(refund.has_claimed_refund(&campaign_id, &buyer));
    assert!(refund.try_claim_refund(&campaign_id, &buyer).is_err());
}
