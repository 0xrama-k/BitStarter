#![no_std]

use bitstarter_shared::{errors::BitStarterError, events, types::CampaignSummary};
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, IntoVal, String, Symbol, Val, Vec,
};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    CampaignWasmHash,
    Token,
    Escrow,
    NextId,
    Campaign(u32),
    AllCampaigns,
    DeveloperCampaigns(Address),
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
        token: Address,
        escrow: Address,
    ) -> Result<(), BitStarterError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(BitStarterError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::CampaignWasmHash, &campaign_wasm_hash);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Escrow, &escrow);
        env.storage().instance().set(&DataKey::NextId, &0_u32);
        env.storage()
            .persistent()
            .set(&DataKey::AllCampaigns, &Vec::<CampaignSummary>::new(&env));
        Ok(())
    }

    pub fn create_campaign(
        env: Env,
        developer: Address,
        title: String,
        description: String,
        metadata_uri: String,
        funding_goal: i128,
        funding_deadline: u64,
        refund_ratio: u32,
        usable_ratio: u32,
        voting_duration: u64,
    ) -> Result<Address, BitStarterError> {
        developer.require_auth();
        Self::validate_campaign_params(
            &env,
            funding_goal,
            funding_deadline,
            refund_ratio,
            usable_ratio,
            voting_duration,
        )?;

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
        let escrow: Address = env
            .storage()
            .instance()
            .get(&DataKey::Escrow)
            .ok_or(BitStarterError::NotInitialized)?;
        let mut salt = [0_u8; 32];
        salt[28..32].copy_from_slice(&id.to_be_bytes());
        let campaign_id = env
            .deployer()
            .with_current_contract(salt)
            .deploy_v2(campaign_wasm_hash, ());
        let mut init_args = Vec::<Val>::new(&env);
        init_args.push_back(developer.clone().into_val(&env));
        init_args.push_back(escrow.into_val(&env));
        init_args.push_back(title.clone().into_val(&env));
        init_args.push_back(description.into_val(&env));
        init_args.push_back(metadata_uri.clone().into_val(&env));
        init_args.push_back(funding_goal.into_val(&env));
        init_args.push_back(funding_deadline.into_val(&env));
        init_args.push_back(refund_ratio.into_val(&env));
        init_args.push_back(usable_ratio.into_val(&env));
        init_args.push_back(voting_duration.into_val(&env));
        let initialized: Result<(), BitStarterError> =
            env.invoke_contract(&campaign_id, &Symbol::new(&env, "initialize"), init_args);
        initialized?;

        let summary = CampaignSummary {
            id: campaign_id.clone(),
            developer: developer.clone(),
            title: title.clone(),
            funding_goal,
            funding_deadline,
            metadata_uri,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Campaign(id), &summary);

        let mut all = Self::get_all_campaigns(env.clone());
        all.push_back(summary.clone());
        env.storage().persistent().set(&DataKey::AllCampaigns, &all);

        let mut developer_campaigns =
            Self::get_campaigns_by_developer(env.clone(), developer.clone());
        developer_campaigns.push_back(summary);
        env.storage().persistent().set(
            &DataKey::DeveloperCampaigns(developer.clone()),
            &developer_campaigns,
        );

        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        events::campaign_created(&env, campaign_id.clone(), developer, title);
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

    pub fn get_campaign_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0_u32)
    }

    pub fn get_campaigns_by_developer(env: Env, developer: Address) -> Vec<CampaignSummary> {
        env.storage()
            .persistent()
            .get(&DataKey::DeveloperCampaigns(developer))
            .unwrap_or(Vec::new(&env))
    }

    fn validate_campaign_params(
        env: &Env,
        funding_goal: i128,
        funding_deadline: u64,
        refund_ratio: u32,
        usable_ratio: u32,
        voting_duration: u64,
    ) -> Result<(), BitStarterError> {
        if funding_goal <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }
        if funding_deadline <= env.ledger().timestamp() {
            return Err(BitStarterError::InvalidDeadline);
        }
        if refund_ratio > 100 || usable_ratio > 100 || refund_ratio + usable_ratio != 100 {
            return Err(BitStarterError::InvalidRatio);
        }
        if voting_duration == 0 {
            return Err(BitStarterError::InvalidVotingDuration);
        }
        Ok(())
    }
}
