#![no_std]

use bitstarter_shared::{
    errors::BitStarterError,
    events,
    types::CampaignSummary,
};
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, IntoVal, String, Symbol, Val, Vec,
};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    CampaignWasmHash,
    NextId,
    Campaign(u32),
    AllCampaigns,
    SellerCampaigns(Address),
}

#[cfg(test)]
mod test;

#[contract]
pub struct CampaignFactory;

#[contractimpl]
impl CampaignFactory {
    pub fn initialize(
        env: Env,
        admin: Address,
        campaign_wasm_hash: BytesN<32>,
    ) -> Result<(), BitStarterError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(BitStarterError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::CampaignWasmHash, &campaign_wasm_hash);
        env.storage().instance().set(&DataKey::NextId, &0_u32);
        env.storage()
            .persistent()
            .set(&DataKey::AllCampaigns, &Vec::<CampaignSummary>::new(&env));
        Ok(())
    }

    pub fn create_campaign(
        env: Env,
        seller: Address,
        title: String,
        description: String,
        goal_amount: i128,
        deadline: u64,
        metadata_uri: String,
    ) -> Result<Address, BitStarterError> {
        seller.require_auth();
        if goal_amount <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(BitStarterError::InvalidDeadline);
        }

        let id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .ok_or(BitStarterError::NotInitialized)?;
        let campaign_wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::CampaignWasmHash)
            .ok_or(BitStarterError::NotInitialized)?;
        let mut salt = [0_u8; 32];
        salt[28..32].copy_from_slice(&id.to_be_bytes());
        let campaign_id = env
            .deployer()
            .with_current_contract(salt)
            .deploy_v2(campaign_wasm_hash, ());
        let mut init_args = Vec::<Val>::new(&env);
        init_args.push_back(env.current_contract_address().into_val(&env));
        init_args.push_back(seller.clone().into_val(&env));
        init_args.push_back(title.clone().into_val(&env));
        init_args.push_back(description.into_val(&env));
        init_args.push_back(goal_amount.into_val(&env));
        init_args.push_back(deadline.into_val(&env));
        init_args.push_back(metadata_uri.clone().into_val(&env));
        let initialized: Result<(), BitStarterError> =
            env.invoke_contract(&campaign_id, &Symbol::new(&env, "initialize"), init_args);
        initialized?;

        let summary = CampaignSummary {
            id: campaign_id.clone(),
            seller: seller.clone(),
            title: title.clone(),
            goal_amount,
            deadline,
            metadata_uri,
        };

        env.storage().persistent().set(&DataKey::Campaign(id), &summary);

        let mut all = Self::get_all_campaigns(env.clone());
        all.push_back(summary.clone());
        env.storage().persistent().set(&DataKey::AllCampaigns, &all);

        let mut seller_campaigns = Self::get_campaigns_by_seller(env.clone(), seller.clone());
        seller_campaigns.push_back(summary);
        env.storage()
            .persistent()
            .set(&DataKey::SellerCampaigns(seller.clone()), &seller_campaigns);

        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        events::campaign_created(&env, campaign_id.clone(), seller, title);
        Ok(campaign_id)
    }

    pub fn get_campaign(env: Env, campaign_id: u32) -> Result<CampaignSummary, BitStarterError> {
        env.storage()
            .persistent()
            .get(&DataKey::Campaign(campaign_id))
            .ok_or(BitStarterError::CampaignNotFound)
    }

    pub fn get_all_campaigns(env: Env) -> Vec<CampaignSummary> {
        env.storage()
            .persistent()
            .get(&DataKey::AllCampaigns)
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_campaigns_by_seller(env: Env, seller: Address) -> Vec<CampaignSummary> {
        env.storage()
            .persistent()
            .get(&DataKey::SellerCampaigns(seller))
            .unwrap_or(Vec::new(&env))
    }
}
