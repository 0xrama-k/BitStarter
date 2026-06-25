use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum BitStarterError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidDeadline = 5,
    CampaignInactive = 6,
    InvalidRatio = 7,
    RefundUnavailable = 8,
    RefundAlreadyClaimed = 9,
    InvestmentNotFound = 10,
    CampaignNotFound = 11,
    InsufficientAvailableFunds = 12,
    VotingNotOpen = 13,
    VotingClosed = 14,
    AlreadyVoted = 15,
    FinalizationUnavailable = 16,
    AlreadyWithdrawn = 17,
    InvalidVotingDuration = 18,
}
