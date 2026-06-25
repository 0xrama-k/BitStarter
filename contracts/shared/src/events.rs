use crate::types::CampaignStatus;
use soroban_sdk::{contractevent, Address, Env, String};

#[contractevent(topics = ["campaign_created"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignCreated {
    #[topic]
    pub developer: Address,
    pub campaign: Address,
    pub title: String,
}

#[contractevent(topics = ["investment_placed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InvestmentPlaced {
    #[topic]
    pub investor: Address,
    pub amount: i128,
    pub refundable: i128,
    pub usable: i128,
}

#[contractevent(topics = ["escrow_deposited"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowDeposited {
    #[topic]
    pub campaign: Address,
    #[topic]
    pub investor: Address,
    pub amount: i128,
}

#[contractevent(topics = ["escrow_released"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowReleased {
    #[topic]
    pub campaign: Address,
    #[topic]
    pub recipient: Address,
    pub amount: i128,
}

#[contractevent(topics = ["usable_funds_withdrawn"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UsableFundsWithdrawn {
    #[topic]
    pub developer: Address,
    pub amount: i128,
}

#[contractevent(topics = ["voting_opened"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VotingOpened {
    #[topic]
    pub campaign: Address,
    pub voting_deadline: u64,
}

#[contractevent(topics = ["vote_cast"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteCast {
    #[topic]
    pub investor: Address,
    pub choice: u32,
    pub power: i128,
}

#[contractevent(topics = ["campaign_finalized"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignFinalized {
    #[topic]
    pub campaign: Address,
    pub status: CampaignStatus,
}

#[contractevent(topics = ["refund_claimed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RefundClaimed {
    #[topic]
    pub campaign: Address,
    #[topic]
    pub investor: Address,
    pub amount: i128,
}

#[contractevent(topics = ["remaining_funds_withdrawn"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RemainingFundsWithdrawn {
    #[topic]
    pub developer: Address,
    pub amount: i128,
}

#[contractevent(topics = ["campaign_cancelled"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignCancelled {
    #[topic]
    pub campaign: Address,
    #[topic]
    pub developer: Address,
}

pub fn campaign_created(env: &Env, campaign: Address, developer: Address, title: String) {
    CampaignCreated {
        developer,
        campaign,
        title,
    }
    .publish(env);
}

pub fn investment_placed(
    env: &Env,
    investor: Address,
    amount: i128,
    refundable: i128,
    usable: i128,
) {
    InvestmentPlaced {
        investor,
        amount,
        refundable,
        usable,
    }
    .publish(env);
}

pub fn escrow_deposited(env: &Env, campaign: Address, investor: Address, amount: i128) {
    EscrowDeposited {
        campaign,
        investor,
        amount,
    }
    .publish(env);
}

pub fn escrow_released(env: &Env, campaign: Address, recipient: Address, amount: i128) {
    EscrowReleased {
        campaign,
        recipient,
        amount,
    }
    .publish(env);
}

pub fn usable_funds_withdrawn(env: &Env, developer: Address, amount: i128) {
    UsableFundsWithdrawn { developer, amount }.publish(env);
}

pub fn voting_opened(env: &Env, campaign: Address, voting_deadline: u64) {
    VotingOpened {
        campaign,
        voting_deadline,
    }
    .publish(env);
}

pub fn vote_cast(env: &Env, investor: Address, choice: u32, power: i128) {
    VoteCast {
        investor,
        choice,
        power,
    }
    .publish(env);
}

pub fn campaign_finalized(env: &Env, campaign: Address, status: CampaignStatus) {
    CampaignFinalized { campaign, status }.publish(env);
}

pub fn refund_claimed(env: &Env, campaign: Address, investor: Address, amount: i128) {
    RefundClaimed {
        campaign,
        investor,
        amount,
    }
    .publish(env);
}

pub fn remaining_funds_withdrawn(env: &Env, developer: Address, amount: i128) {
    RemainingFundsWithdrawn { developer, amount }.publish(env);
}

pub fn campaign_cancelled(env: &Env, campaign: Address, developer: Address) {
    CampaignCancelled {
        campaign,
        developer,
    }
    .publish(env);
}
