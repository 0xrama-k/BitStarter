use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CampaignStatus {
    Active,
    VotingOpen,
    Approved,
    Rejected,
    Cancelled,
}

pub const VOTE_APPROVE: u32 = 1;
pub const VOTE_REJECT: u32 = 2;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InvestorPosition {
    pub total_invested: i128,
    pub refundable_amount: i128,
    pub usable_amount: i128,
    pub has_voted: bool,
    pub vote_choice: Option<u32>,
    pub refunded: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignInfo {
    pub developer: Address,
    pub token: Address,
    pub escrow: Address,
    pub title: String,
    pub description: String,
    pub funding_goal: i128,
    pub funding_deadline: u64,
    pub metadata_uri: String,
    pub refund_ratio: u32,
    pub usable_ratio: u32,
    pub voting_duration: u64,
    pub status: CampaignStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignSummary {
    pub id: Address,
    pub developer: Address,
    pub title: String,
    pub funding_goal: i128,
    pub funding_deadline: u64,
    pub metadata_uri: String,
}
