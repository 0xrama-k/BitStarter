#![no_std]

use bitstarter_shared::{
    errors::BitStarterError,
    events,
    types::{CampaignInfo, CampaignStatus, InvestorPosition, VOTE_APPROVE, VOTE_REJECT},
};
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, IntoVal, String, Symbol, Val, Vec,
};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Initialized,
    Info,
    Position(Address),
    TotalInvested,
    TotalRefundReserved,
    TotalUsableAllocated,
    TotalUsableWithdrawn,
    ApprovalPower,
    RejectionPower,
    VotingDeadline,
    RemainingWithdrawn,
}

#[contract]
pub struct InvestmentCampaign;

#[contractimpl]
impl InvestmentCampaign {
    pub fn initialize(
        env: Env,
        developer: Address,
        escrow: Address,
        title: String,
        description: String,
        metadata_uri: String,
        funding_goal: i128,
        funding_deadline: u64,
        refund_ratio: u32,
        usable_ratio: u32,
        voting_duration: u64,
    ) -> Result<(), BitStarterError> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(BitStarterError::AlreadyInitialized);
        }
        Self::validate_campaign_params(
            &env,
            funding_goal,
            funding_deadline,
            refund_ratio,
            usable_ratio,
            voting_duration,
        )?;
        let token = Self::escrow_get_token(&env, &escrow)?;

        let info = CampaignInfo {
            developer,
            token,
            escrow,
            title,
            description,
            funding_goal,
            funding_deadline,
            metadata_uri,
            refund_ratio,
            usable_ratio,
            voting_duration,
            status: CampaignStatus::Active,
        };
        env.storage().instance().set(&DataKey::Info, &info);
        env.storage()
            .instance()
            .set(&DataKey::TotalInvested, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::TotalRefundReserved, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::TotalUsableAllocated, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::TotalUsableWithdrawn, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::ApprovalPower, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::RejectionPower, &0_i128);
        env.storage()
            .instance()
            .set(&DataKey::RemainingWithdrawn, &false);
        env.storage().instance().set(&DataKey::Initialized, &true);
        Ok(())
    }

    pub fn invest(env: Env, investor: Address, amount: i128) -> Result<(), BitStarterError> {
        investor.require_auth();
        if amount <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }

        let info = Self::load_info(&env)?;
        if info.status != CampaignStatus::Active || env.ledger().timestamp() > info.funding_deadline
        {
            return Err(BitStarterError::CampaignInactive);
        }

        let usable_amount = amount * (info.usable_ratio as i128) / 100;
        let refundable_amount = amount - usable_amount;
        let mut position = Self::get_investor_position(env.clone(), investor.clone());
        position.total_invested += amount;
        position.usable_amount += usable_amount;
        position.refundable_amount += refundable_amount;

        Self::escrow_deposit(&env, &info.escrow, investor.clone(), amount)?;

        env.storage()
            .persistent()
            .set(&DataKey::Position(investor.clone()), &position);
        Self::add_i128(&env, DataKey::TotalInvested, amount);
        Self::add_i128(&env, DataKey::TotalUsableAllocated, usable_amount);
        Self::add_i128(&env, DataKey::TotalRefundReserved, refundable_amount);
        events::investment_placed(&env, investor, amount, refundable_amount, usable_amount);
        Ok(())
    }

    pub fn withdraw_available_funds(
        env: Env,
        developer: Address,
        amount: i128,
    ) -> Result<(), BitStarterError> {
        developer.require_auth();
        if amount <= 0 {
            return Err(BitStarterError::InvalidAmount);
        }
        let info = Self::load_info(&env)?;
        Self::require_developer(&info, &developer)?;
        if !matches!(
            info.status,
            CampaignStatus::Active | CampaignStatus::VotingOpen
        ) {
            return Err(BitStarterError::CampaignInactive);
        }

        let available = Self::get_total_usable_allocated(env.clone())
            - Self::get_total_usable_withdrawn(env.clone());
        if amount > available {
            return Err(BitStarterError::InsufficientAvailableFunds);
        }

        Self::add_i128(&env, DataKey::TotalUsableWithdrawn, amount);
        Self::escrow_release(&env, &info.escrow, developer.clone(), amount)?;
        events::usable_funds_withdrawn(&env, developer, amount);
        Ok(())
    }

    pub fn mark_finished(env: Env, developer: Address) -> Result<(), BitStarterError> {
        developer.require_auth();
        let info = Self::load_info(&env)?;
        Self::require_developer(&info, &developer)?;
        Self::open_voting(env)
    }

    pub fn open_voting_after_deadline(env: Env) -> Result<(), BitStarterError> {
        let info = Self::load_info(&env)?;
        if env.ledger().timestamp() <= info.funding_deadline {
            return Err(BitStarterError::InvalidDeadline);
        }
        Self::open_voting(env)
    }

    pub fn vote(env: Env, investor: Address, choice: u32) -> Result<(), BitStarterError> {
        investor.require_auth();
        let info = Self::load_info(&env)?;
        if info.status != CampaignStatus::VotingOpen {
            return Err(BitStarterError::VotingNotOpen);
        }
        let voting_deadline = Self::get_voting_deadline(env.clone())?;
        if env.ledger().timestamp() > voting_deadline {
            return Err(BitStarterError::VotingClosed);
        }

        let mut position = Self::get_investor_position(env.clone(), investor.clone());
        if position.total_invested <= 0 {
            return Err(BitStarterError::InvestmentNotFound);
        }
        if position.has_voted {
            return Err(BitStarterError::AlreadyVoted);
        }

        let power = position.total_invested;
        if choice == VOTE_APPROVE {
            Self::add_i128(&env, DataKey::ApprovalPower, power);
        } else if choice == VOTE_REJECT {
            Self::add_i128(&env, DataKey::RejectionPower, power);
        } else {
            return Err(BitStarterError::VotingNotOpen);
        }
        position.has_voted = true;
        position.vote_choice = Some(choice);
        env.storage()
            .persistent()
            .set(&DataKey::Position(investor.clone()), &position);
        events::vote_cast(&env, investor, choice, power);
        Ok(())
    }

    pub fn finalize_campaign(env: Env) -> Result<CampaignStatus, BitStarterError> {
        let mut info = Self::load_info(&env)?;
        if info.status != CampaignStatus::VotingOpen {
            return Err(BitStarterError::VotingNotOpen);
        }
        let voting_deadline = Self::get_voting_deadline(env.clone())?;
        if env.ledger().timestamp() <= voting_deadline {
            return Err(BitStarterError::FinalizationUnavailable);
        }

        let approval_power = Self::get_approval_power(env.clone());
        let total_invested = Self::get_total_invested(env.clone());
        info.status = if approval_power > total_invested / 2 {
            CampaignStatus::Approved
        } else {
            CampaignStatus::Rejected
        };
        let status = info.status.clone();
        env.storage().instance().set(&DataKey::Info, &info);
        events::campaign_finalized(&env, env.current_contract_address(), status.clone());
        Ok(status)
    }

    pub fn withdraw_remaining_funds(env: Env, developer: Address) -> Result<i128, BitStarterError> {
        developer.require_auth();
        let info = Self::load_info(&env)?;
        Self::require_developer(&info, &developer)?;
        if info.status != CampaignStatus::Approved {
            return Err(BitStarterError::CampaignInactive);
        }
        if Self::remaining_withdrawn(env.clone()) {
            return Err(BitStarterError::AlreadyWithdrawn);
        }

        let amount = Self::escrow_get_campaign_balance(&env, &info.escrow)?;
        if amount <= 0 {
            return Err(BitStarterError::InsufficientAvailableFunds);
        }
        env.storage()
            .instance()
            .set(&DataKey::RemainingWithdrawn, &true);
        Self::escrow_release(&env, &info.escrow, developer.clone(), amount)?;
        events::remaining_funds_withdrawn(&env, developer, amount);
        Ok(amount)
    }

    pub fn claim_refund(env: Env, investor: Address) -> Result<i128, BitStarterError> {
        investor.require_auth();
        let info = Self::load_info(&env)?;
        if !matches!(
            info.status,
            CampaignStatus::Rejected | CampaignStatus::Cancelled
        ) {
            return Err(BitStarterError::RefundUnavailable);
        }

        let mut position = Self::get_investor_position(env.clone(), investor.clone());
        if position.refundable_amount <= 0 {
            return Err(BitStarterError::InvestmentNotFound);
        }
        if position.refunded {
            return Err(BitStarterError::RefundAlreadyClaimed);
        }

        position.refunded = true;
        env.storage()
            .persistent()
            .set(&DataKey::Position(investor.clone()), &position);
        Self::escrow_release(
            &env,
            &info.escrow,
            investor.clone(),
            position.refundable_amount,
        )?;
        events::refund_claimed(
            &env,
            env.current_contract_address(),
            investor,
            position.refundable_amount,
        );
        Ok(position.refundable_amount)
    }

    pub fn cancel_campaign(env: Env, developer: Address) -> Result<(), BitStarterError> {
        developer.require_auth();
        let mut info = Self::load_info(&env)?;
        Self::require_developer(&info, &developer)?;
        if !matches!(
            info.status,
            CampaignStatus::Active | CampaignStatus::VotingOpen
        ) {
            return Err(BitStarterError::CampaignInactive);
        }
        info.status = CampaignStatus::Cancelled;
        env.storage().instance().set(&DataKey::Info, &info);
        events::campaign_cancelled(&env, env.current_contract_address(), developer);
        Ok(())
    }

    pub fn get_campaign_info(env: Env) -> Result<CampaignInfo, BitStarterError> {
        Self::load_info(&env)
    }

    pub fn get_investor_position(env: Env, investor: Address) -> InvestorPosition {
        env.storage()
            .persistent()
            .get(&DataKey::Position(investor))
            .unwrap_or(InvestorPosition {
                total_invested: 0,
                refundable_amount: 0,
                usable_amount: 0,
                has_voted: false,
                vote_choice: None,
                refunded: false,
            })
    }

    pub fn get_total_invested(env: Env) -> i128 {
        Self::read_i128(&env, DataKey::TotalInvested)
    }

    pub fn get_total_refund_reserved(env: Env) -> i128 {
        Self::read_i128(&env, DataKey::TotalRefundReserved)
    }

    pub fn get_total_usable_allocated(env: Env) -> i128 {
        Self::read_i128(&env, DataKey::TotalUsableAllocated)
    }

    pub fn get_total_usable_withdrawn(env: Env) -> i128 {
        Self::read_i128(&env, DataKey::TotalUsableWithdrawn)
    }

    pub fn get_approval_power(env: Env) -> i128 {
        Self::read_i128(&env, DataKey::ApprovalPower)
    }

    pub fn get_rejection_power(env: Env) -> i128 {
        Self::read_i128(&env, DataKey::RejectionPower)
    }

    pub fn get_voting_deadline(env: Env) -> Result<u64, BitStarterError> {
        env.storage()
            .instance()
            .get(&DataKey::VotingDeadline)
            .ok_or(BitStarterError::VotingNotOpen)
    }

    pub fn get_status(env: Env) -> Result<CampaignStatus, BitStarterError> {
        Ok(Self::load_info(&env)?.status)
    }

    fn open_voting(env: Env) -> Result<(), BitStarterError> {
        let mut info = Self::load_info(&env)?;
        if info.status != CampaignStatus::Active {
            return Err(BitStarterError::CampaignInactive);
        }

        let voting_deadline = env.ledger().timestamp() + info.voting_duration;
        info.status = CampaignStatus::VotingOpen;
        env.storage().instance().set(&DataKey::Info, &info);
        env.storage()
            .instance()
            .set(&DataKey::VotingDeadline, &voting_deadline);
        events::voting_opened(&env, env.current_contract_address(), voting_deadline);
        Ok(())
    }

    fn load_info(env: &Env) -> Result<CampaignInfo, BitStarterError> {
        env.storage()
            .instance()
            .get(&DataKey::Info)
            .ok_or(BitStarterError::NotInitialized)
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

    fn require_developer(info: &CampaignInfo, developer: &Address) -> Result<(), BitStarterError> {
        if developer != &info.developer {
            return Err(BitStarterError::Unauthorized);
        }
        Ok(())
    }

    fn read_i128(env: &Env, key: DataKey) -> i128 {
        env.storage().instance().get(&key).unwrap_or(0_i128)
    }

    fn add_i128(env: &Env, key: DataKey, amount: i128) {
        let current = Self::read_i128(env, key.clone());
        env.storage().instance().set(&key, &(current + amount));
    }

    fn remaining_withdrawn(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::RemainingWithdrawn)
            .unwrap_or(false)
    }

    fn escrow_get_token(env: &Env, escrow: &Address) -> Result<Address, BitStarterError> {
        let result: Result<Address, BitStarterError> =
            env.invoke_contract(escrow, &Symbol::new(env, "get_token"), Vec::<Val>::new(env));
        result
    }

    fn escrow_get_campaign_balance(env: &Env, escrow: &Address) -> Result<i128, BitStarterError> {
        let mut args = Vec::<Val>::new(env);
        args.push_back(env.current_contract_address().into_val(env));
        let result: Result<i128, BitStarterError> =
            env.invoke_contract(escrow, &Symbol::new(env, "get_campaign_balance"), args);
        result
    }

    fn escrow_deposit(
        env: &Env,
        escrow: &Address,
        investor: Address,
        amount: i128,
    ) -> Result<(), BitStarterError> {
        let mut args = Vec::<Val>::new(env);
        args.push_back(env.current_contract_address().into_val(env));
        args.push_back(investor.into_val(env));
        args.push_back(amount.into_val(env));
        let result: Result<(), BitStarterError> =
            env.invoke_contract(escrow, &Symbol::new(env, "deposit"), args);
        result
    }

    fn escrow_release(
        env: &Env,
        escrow: &Address,
        recipient: Address,
        amount: i128,
    ) -> Result<(), BitStarterError> {
        let mut args = Vec::<Val>::new(env);
        args.push_back(env.current_contract_address().into_val(env));
        args.push_back(recipient.into_val(env));
        args.push_back(amount.into_val(env));
        let result: Result<(), BitStarterError> =
            env.invoke_contract(escrow, &Symbol::new(env, "release"), args);
        result
    }
}

#[cfg(test)]
mod test;
