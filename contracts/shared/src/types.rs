use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CampaignStatus {
    Active,
    Successful,
    Failed,
    Withdrawn,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignInfo {
    pub factory: Address,
    pub seller: Address,
    pub title: String,
    pub description: String,
    pub goal_amount: i128,
    pub total_raised: i128,
    pub deadline: u64,
    pub metadata_uri: String,
    pub status: CampaignStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignSummary {
    pub id: Address,
    pub seller: Address,
    pub title: String,
    pub goal_amount: i128,
    pub deadline: u64,
    pub metadata_uri: String,
}
