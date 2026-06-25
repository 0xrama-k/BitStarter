#![no_std]

use bitstarter_shared::{errors::BitStarterError, events};
use soroban_sdk::{contract, contractimpl, contracttype, token::TokenClient, Address, Env};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Token,
    CampaignBalance(Address),
    TotalDeposited(Address),
    TotalReleased(Address),
}

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), BitStarterError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(BitStarterError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        Ok(())
    }

    pub fn deposit(
        env: Env,
        campaign: Address,
        investor: Address,
        amount: i128,
    ) -> Result<(), BitStarterError> {
        investor.require_auth();
        if amount <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }

        let token_address = Self::load_token(&env)?;
        let token = TokenClient::new(&env, &token_address);
        token.transfer(&investor, &env.current_contract_address(), &amount);

        Self::add_i128(&env, DataKey::CampaignBalance(campaign.clone()), amount);
        Self::add_i128(&env, DataKey::TotalDeposited(campaign.clone()), amount);
        events::escrow_deposited(&env, campaign, investor, amount);
        Ok(())
    }

    pub fn release(
        env: Env,
        campaign: Address,
        recipient: Address,
        amount: i128,
    ) -> Result<(), BitStarterError> {
        campaign.require_auth();
        if amount <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }

        let balance_key = DataKey::CampaignBalance(campaign.clone());
        let balance = Self::read_i128(&env, balance_key.clone());
        if amount > balance {
            return Err(BitStarterError::InsufficientAvailableFunds);
        }

        env.storage()
            .persistent()
            .set(&balance_key, &(balance - amount));
        Self::add_i128(&env, DataKey::TotalReleased(campaign.clone()), amount);

        let token_address = Self::load_token(&env)?;
        let token = TokenClient::new(&env, &token_address);
        token.transfer(&env.current_contract_address(), &recipient, &amount);
        events::escrow_released(&env, campaign, recipient, amount);
        Ok(())
    }

    pub fn get_token(env: Env) -> Result<Address, BitStarterError> {
        Self::load_token(&env)
    }

    pub fn get_campaign_balance(env: Env, campaign: Address) -> i128 {
        Self::read_i128(&env, DataKey::CampaignBalance(campaign))
    }

    pub fn get_total_deposited(env: Env, campaign: Address) -> i128 {
        Self::read_i128(&env, DataKey::TotalDeposited(campaign))
    }

    pub fn get_total_released(env: Env, campaign: Address) -> i128 {
        Self::read_i128(&env, DataKey::TotalReleased(campaign))
    }

    fn load_token(env: &Env) -> Result<Address, BitStarterError> {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(BitStarterError::NotInitialized)
    }

    fn read_i128(env: &Env, key: DataKey) -> i128 {
        env.storage().persistent().get(&key).unwrap_or(0_i128)
    }

    fn add_i128(env: &Env, key: DataKey, amount: i128) {
        let current = Self::read_i128(env, key.clone());
        env.storage().persistent().set(&key, &(current + amount));
    }
}

#[cfg(test)]
mod test;
