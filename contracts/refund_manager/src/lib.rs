#![no_std]

use bitstarter_shared::{errors::BitStarterError, events, types::CampaignStatus};
use preorder_campaign::PreorderCampaignClient as CampaignClient;
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Claimed(Address, Address),
}

#[contract]
pub struct RefundManager;

#[contractimpl]
impl RefundManager {
    pub fn claim_refund(env: Env, campaign_id: Address, buyer: Address) -> Result<i128, BitStarterError> {
        buyer.require_auth();
        if Self::has_claimed_refund(env.clone(), campaign_id.clone(), buyer.clone()) {
            return Err(BitStarterError::RefundAlreadyClaimed);
        }
        if !Self::is_refund_available(env.clone(), campaign_id.clone(), buyer.clone())? {
            return Err(BitStarterError::RefundUnavailable);
        }

        let campaign = CampaignClient::new(&env, &campaign_id);
        let amount = campaign.get_buyer_order(&buyer);
        env.storage()
            .persistent()
            .set(&DataKey::Claimed(campaign_id.clone(), buyer.clone()), &true);
        events::refund_claimed(&env, campaign_id, buyer, amount);
        Ok(amount)
    }

    pub fn is_refund_available(
        env: Env,
        campaign_id: Address,
        buyer: Address,
    ) -> Result<bool, BitStarterError> {
        let campaign = CampaignClient::new(&env, &campaign_id);
        let amount = campaign.get_buyer_order(&buyer);
        if amount <= 0 {
            return Err(BitStarterError::OrderNotFound);
        }
        if Self::has_claimed_refund(env.clone(), campaign_id, buyer) {
            return Ok(false);
        }
        let status = campaign.get_status();
        Ok(matches!(status, CampaignStatus::Failed | CampaignStatus::Cancelled))
    }

    pub fn has_claimed_refund(env: Env, campaign_id: Address, buyer: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Claimed(campaign_id, buyer))
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod test;
