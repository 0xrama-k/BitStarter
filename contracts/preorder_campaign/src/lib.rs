#![no_std]

use bitstarter_shared::{
    errors::BitStarterError,
    events,
    types::{CampaignInfo, CampaignStatus},
};
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Initialized,
    Info,
    Order(Address),
}

#[contract]
pub struct PreorderCampaign;

#[contractimpl]
impl PreorderCampaign {
    pub fn initialize(
        env: Env,
        factory: Address,
        seller: Address,
        title: String,
        description: String,
        goal_amount: i128,
        deadline: u64,
        metadata_uri: String,
    ) -> Result<(), BitStarterError> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(BitStarterError::AlreadyInitialized);
        }
        if goal_amount <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(BitStarterError::InvalidDeadline);
        }

        let info = CampaignInfo {
            factory,
            seller,
            title,
            description,
            goal_amount,
            total_raised: 0,
            deadline,
            metadata_uri,
            status: CampaignStatus::Active,
        };
        env.storage().instance().set(&DataKey::Info, &info);
        env.storage().instance().set(&DataKey::Initialized, &true);
        Ok(())
    }

    pub fn place_order(env: Env, buyer: Address, amount: i128) -> Result<(), BitStarterError> {
        buyer.require_auth();
        if amount <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }

        let mut info = Self::load_info(&env)?;
        if info.status != CampaignStatus::Active || env.ledger().timestamp() > info.deadline {
            return Err(BitStarterError::CampaignInactive);
        }

        let key = DataKey::Order(buyer.clone());
        let current = env.storage().persistent().get(&key).unwrap_or(0_i128);
        let next_order = current + amount;
        info.total_raised += amount;
        env.storage().persistent().set(&key, &next_order);

        if info.total_raised >= info.goal_amount {
            info.status = CampaignStatus::Successful;
            events::goal_reached(&env, info.seller.clone(), info.total_raised);
        }

        events::order_placed(&env, buyer, amount, info.total_raised);
        env.storage().instance().set(&DataKey::Info, &info);
        Ok(())
    }

    pub fn get_campaign_info(env: Env) -> Result<CampaignInfo, BitStarterError> {
        Self::load_info(&env)
    }

    pub fn get_buyer_order(env: Env, buyer: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Order(buyer))
            .unwrap_or(0_i128)
    }

    pub fn get_total_raised(env: Env) -> Result<i128, BitStarterError> {
        Ok(Self::load_info(&env)?.total_raised)
    }

    pub fn get_status(env: Env) -> Result<CampaignStatus, BitStarterError> {
        let mut info = Self::load_info(&env)?;
        if info.status == CampaignStatus::Active && env.ledger().timestamp() > info.deadline {
            info.status = CampaignStatus::Failed;
            env.storage().instance().set(&DataKey::Info, &info);
        }
        Ok(info.status)
    }

    pub fn mark_successful_if_goal_reached(env: Env) -> Result<CampaignStatus, BitStarterError> {
        let mut info = Self::load_info(&env)?;
        if info.status == CampaignStatus::Active && info.total_raised >= info.goal_amount {
            info.status = CampaignStatus::Successful;
            events::goal_reached(&env, info.seller.clone(), info.total_raised);
            env.storage().instance().set(&DataKey::Info, &info);
        }
        Ok(info.status)
    }

    pub fn withdraw_funds(env: Env, seller: Address) -> Result<i128, BitStarterError> {
        seller.require_auth();
        let mut info = Self::load_info(&env)?;
        if seller != info.seller {
            return Err(BitStarterError::Unauthorized);
        }
        if info.status != CampaignStatus::Successful {
            return Err(BitStarterError::GoalNotReached);
        }

        let amount = info.total_raised;
        info.status = CampaignStatus::Withdrawn;
        env.storage().instance().set(&DataKey::Info, &info);
        events::funds_withdrawn(&env, seller, amount);
        Ok(amount)
    }

    pub fn cancel_campaign(env: Env, seller: Address) -> Result<(), BitStarterError> {
        seller.require_auth();
        let mut info = Self::load_info(&env)?;
        if seller != info.seller {
            return Err(BitStarterError::Unauthorized);
        }
        if info.status != CampaignStatus::Active {
            return Err(BitStarterError::CampaignInactive);
        }
        info.status = CampaignStatus::Cancelled;
        env.storage().instance().set(&DataKey::Info, &info);
        events::campaign_cancelled(&env, seller);
        Ok(())
    }

    fn load_info(env: &Env) -> Result<CampaignInfo, BitStarterError> {
        env.storage()
            .instance()
            .get(&DataKey::Info)
            .ok_or(BitStarterError::NotInitialized)
    }
}

#[cfg(test)]
mod test;
