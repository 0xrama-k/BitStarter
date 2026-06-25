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
- `NEXT_PUBLIC_ESCROW_CONTRACT_ID`
- `NEXT_PUBLIC_REFUND_MANAGER_CONTRACT_ID`
- `NEXT_PUBLIC_INVESTMENT_CAMPAIGN_WASM_HASH`
- `NEXT_PUBLIC_STELLAR_READ_SOURCE_ACCOUNT`

## Current Testnet Deployment

- Network: Stellar Testnet
- CampaignFactory: `CC56AKO3H3FJS3O6C4MKJK4QTHPXLZQMUPVRVZUXRYPYMO65AD3LNVUL`
- Escrow: `CCXUWIED3RKTFDZQH75D7BMG2N73VNNYQZSCX6KCAHIPRSPROOXTIXH7`
- RefundManager: `CBXSHHMMQSNX35R6BEHBT63I2BQEJFIBLKW5NMEC4ZNR4OQDO5YGWOXY`
- InvestmentCampaign Wasm hash: `ed27f0f147d633bf29f4e5e37c119b24c62fce499447b5b2ee0392e1516bf69b`
- Demo InvestmentCampaign: `CATHURPCMY4ECYK3UDQSRZIEECQFZWGNI5R3RLBLDWHUBVU7S2VSVJEM`
- Demo campaign creation transaction hash: `10a187e3fc2b2e0f7b1fec4b0bd1bb88c20268f56a4fd6c3c179ed6dbd50bea6`
- Demo escrow investment transaction hash: `1c1243c43e27c645d16348cae02ee5cc63f596f442b0502b382b8033c77f80c6`
