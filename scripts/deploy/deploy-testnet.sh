#!/usr/bin/env bash
set -euo pipefail

NETWORK="${STELLAR_NETWORK:-testnet}"
RPC_URL="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
SOURCE="${STELLAR_SOURCE:-bitstarter-deployer}"

stellar network add "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "Test SDF Network ; September 2015" || true
stellar keys fund "$SOURCE" --network "$NETWORK"

cargo build --workspace --target wasm32v1-none --release

echo "Deploying BitStarter contracts to $NETWORK"
FACTORY_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/campaign_factory.wasm --source "$SOURCE" --network "$NETWORK")
CAMPAIGN_WASM_HASH=$(stellar contract upload --wasm target/wasm32v1-none/release/preorder_campaign.wasm --source "$SOURCE" --network "$NETWORK")
REFUND_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/refund_manager.wasm --source "$SOURCE" --network "$NETWORK")

cat <<EOF
NEXT_PUBLIC_FACTORY_CONTRACT_ID=$FACTORY_ID
NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID=$REFUND_ID
NEXT_PUBLIC_PREORDER_CAMPAIGN_WASM_HASH=$CAMPAIGN_WASM_HASH
EOF
