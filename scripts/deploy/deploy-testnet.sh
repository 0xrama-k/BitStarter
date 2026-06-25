#!/usr/bin/env bash
set -euo pipefail

NETWORK="${STELLAR_NETWORK:-testnet}"
RPC_URL="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
SOURCE="${STELLAR_SOURCE:-bitstarter-deployer}"
NETWORK_PASSPHRASE="${STELLAR_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"

stellar network add "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" || true
stellar keys fund "$SOURCE" --network "$NETWORK"

cargo build --workspace --target wasm32v1-none --release

extract_contract_id() {
  grep -Eo 'C[A-Z2-7]{55}' | head -n 1
}

extract_wasm_hash() {
  grep -Eio '[a-f0-9]{64}' | head -n 1
}

echo "Deploying BitStarter contracts to $NETWORK"
FACTORY_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/campaign_factory.wasm --source "$SOURCE" --network "$NETWORK" | extract_contract_id)
ESCROW_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/escrow.wasm --source "$SOURCE" --network "$NETWORK" | extract_contract_id)
CAMPAIGN_WASM_HASH=$(stellar -q contract upload --wasm target/wasm32v1-none/release/investment_campaign.wasm --source "$SOURCE" --network "$NETWORK" | extract_wasm_hash)
REFUND_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/refund_manager.wasm --source "$SOURCE" --network "$NETWORK" | extract_contract_id)
ADMIN=$(stellar keys address "$SOURCE")
XLM_TOKEN_CONTRACT_ID="${XLM_TOKEN_CONTRACT_ID:-$(node -e "const { Asset } = require('./apps/web/node_modules/@stellar/stellar-sdk'); console.log(Asset.native().contractId(process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015'))")}"

stellar contract invoke \
  --id "$ESCROW_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$ADMIN" \
  --token "$XLM_TOKEN_CONTRACT_ID"

stellar contract invoke \
  --id "$FACTORY_ID" \
  --source "$SOURCE" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$ADMIN" \
  --campaign_wasm_hash "$CAMPAIGN_WASM_HASH" \
  --token "$XLM_TOKEN_CONTRACT_ID" \
  --escrow "$ESCROW_ID"

cat <<EOF
NEXT_PUBLIC_FACTORY_CONTRACT_ID=$FACTORY_ID
NEXT_PUBLIC_ESCROW_CONTRACT_ID=$ESCROW_ID
NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID=$REFUND_ID
NEXT_PUBLIC_INVESTMENT_CAMPAIGN_WASM_HASH=$CAMPAIGN_WASM_HASH
NEXT_PUBLIC_XLM_TOKEN_CONTRACT_ID=$XLM_TOKEN_CONTRACT_ID
EOF
