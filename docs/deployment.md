# Deployment

## Stellar Testnet

1. Install Rust and Stellar CLI.
2. Add the Soroban target:

```bash
rustup target add wasm32v1-none
```

3. Configure a deployer identity:

```bash
stellar keys generate bitstarter-deployer --network testnet
stellar keys fund bitstarter-deployer --network testnet
```

4. Build and deploy:

```bash
STELLAR_SOURCE=bitstarter-deployer ./scripts/deploy/deploy-testnet.sh
```

5. Copy the printed contract IDs into `apps/web/.env.local`.

## Vercel

Import the GitHub repository and set the project root to `apps/web`.

- Build command: `npm run build`
- Install command: `npm install`
- Output directory: `.next`

Environment variables:

- `NEXT_PUBLIC_STELLAR_NETWORK`
- `NEXT_PUBLIC_STELLAR_RPC_URL`
- `NEXT_PUBLIC_FACTORY_CONTRACT_ID`
- `NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID`
- `NEXT_PUBLIC_PREORDER_CAMPAIGN_WASM_HASH`

## Current Testnet Deployment

- Network: Stellar Testnet
- CampaignFactory: `CCD3HXGDXEKNWXPGR7X3SP6PMANFM2DTSOTML47DOEL376PMI5AAZBB4`
- RefundManager: `CCGHFVCK6S67QJWYOVE6OSOVDKQUFRRY5XIDFGTITN52IYNJD3P3443E`
- PreorderCampaign Wasm hash: `e007bdf2adc210a0121587afde1cfaf18f3b30500522d0bdf06f1324af0d36fe`
- Factory initialize transaction hash: `a7dabbb489332a5c49029768aa13c18c32f4493b6c6959ee0429e9b14bb06936`
- Factory deploy transaction hash: `45a6fdd1b5fcd57be03e1fe73ad04f3f8524a24add3ebdb0bd6c4181d6349c76`
- RefundManager deploy transaction hash: `b37c0fb327eacf5a46076e183ca9fe50eecb52d8712325909ae0ed47120e1459`
