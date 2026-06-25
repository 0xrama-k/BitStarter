#![no_std]

use bitstarter_shared::{errors::BitStarterError, types::CampaignStatus};
use investment_campaign::InvestmentCampaignClient as CampaignClient;
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct RefundManager;

#[contractimpl]
impl RefundManager {
    pub fn claim_refund(
        env: Env,
        campaign_id: Address,
        investor: Address,
    ) -> Result<i128, BitStarterError> {
        investor.require_auth();
        if !Self::is_refund_available(env.clone(), campaign_id.clone(), investor.clone())? {
            return Err(BitStarterError::RefundUnavailable);
        }

        let campaign = CampaignClient::new(&env, &campaign_id);
        Ok(campaign.claim_refund(&investor))
    }

    pub fn is_refund_available(
        env: Env,
        campaign_id: Address,
        investor: Address,
    ) -> Result<bool, BitStarterError> {
        let campaign = CampaignClient::new(&env, &campaign_id);
        let position = campaign.get_investor_position(&investor);
        if position.total_invested <= 0 {
            return Err(BitStarterError::InvestmentNotFound);
        }
        if position.refunded {
            return Ok(false);
        }
        let status = campaign.get_status();
        Ok(matches!(
            status,
            CampaignStatus::Rejected | CampaignStatus::Cancelled
        ))
    }

    pub fn has_claimed_refund(env: Env, campaign_id: Address, investor: Address) -> bool {
        let campaign = CampaignClient::new(&env, &campaign_id);
        campaign.get_investor_position(&investor).refunded
    }
}

#[cfg(test)]
mod test;
