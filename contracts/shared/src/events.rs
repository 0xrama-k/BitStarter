use soroban_sdk::{symbol_short, Address, Env, String, Symbol};

pub const CAMPAIGN_CREATED: Symbol = symbol_short!("created");
pub const ORDER_PLACED: Symbol = symbol_short!("ordered");
pub const GOAL_REACHED: Symbol = symbol_short!("goal");
pub const FUNDS_WITHDRAWN: Symbol = symbol_short!("withdraw");
pub const CAMPAIGN_CANCELLED: Symbol = symbol_short!("cancel");
pub const REFUND_CLAIMED: Symbol = symbol_short!("refund");

pub fn campaign_created(env: &Env, campaign: Address, seller: Address, title: String) {
    env.events()
        .publish((CAMPAIGN_CREATED, seller), (campaign, title));
}

pub fn order_placed(env: &Env, buyer: Address, amount: i128, total_raised: i128) {
    env.events()
        .publish((ORDER_PLACED, buyer), (amount, total_raised));
}

pub fn goal_reached(env: &Env, seller: Address, total_raised: i128) {
    env.events().publish((GOAL_REACHED, seller), total_raised);
}

pub fn funds_withdrawn(env: &Env, seller: Address, amount: i128) {
    env.events().publish((FUNDS_WITHDRAWN, seller), amount);
}

pub fn campaign_cancelled(env: &Env, seller: Address) {
    env.events().publish((CAMPAIGN_CANCELLED, seller), ());
}

pub fn refund_claimed(env: &Env, campaign: Address, buyer: Address, amount: i128) {
    env.events()
        .publish((REFUND_CLAIMED, campaign, buyer), amount);
}
