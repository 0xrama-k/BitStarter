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
- `NEXT_PUBLIC_STELLAR_READ_SOURCE_ACCOUNT`

## Current Testnet Deployment

- Network: Stellar Testnet
- CampaignFactory: `CCWOBOZBK4DMBKVZO6QEYPXMSXSY5TA66DBVVABAGHN5NUH4MBHDH5KA`
- RefundManager: `CCGHFVCK6S67QJWYOVE6OSOVDKQUFRRY5XIDFGTITN52IYNJD3P3443E`
- PreorderCampaign Wasm hash: `e007bdf2adc210a0121587afde1cfaf18f3b30500522d0bdf06f1324af0d36fe`
- Demo PreorderCampaign: `CAD6TNAY6Y5PGIZCZHWXUFOYILQBZEHQ5BOSDJEB35TJ6NJNLIILSV3R`
- Factory initialize transaction hash: `5cbc040bf4d5c3f51c47ede4c45f8659e14e322e2ddc48171cb99e19bea67865`
- Demo campaign creation transaction hash: `a612da34a5adb5d6f58b0983441723d368b2a783f02015b2981a6ba27beb704c`
- Factory deploy transaction hash: `cc3bd2202d0f8b9e32d49dbe1d87a942c694e0152a5347d1936a1dcd61b0d0ad`
- RefundManager deploy transaction hash: `b37c0fb327eacf5a46076e183ca9fe50eecb52d8712325909ae0ed47120e1459`
