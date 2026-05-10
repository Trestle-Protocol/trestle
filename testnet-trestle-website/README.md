# testnet.trestle.website

Testnet platform for Trestle Protocol. Smart contracts deployed on Polygon Amoy, with a React/Vite frontend.

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| Tier1Staking | Basic staking pool |
| Tier2Staking | Mid-tier staking pool |
| Tier3Vault | High-tier staking vault |
| FeeDistributor | Fee distribution logic |
| GovernanceToken | Protocol governance |
| DigitalRWA | Real-world asset tokens |
| AIDisputeResolver | Two-step AI dispute resolution |
| HNOBTMining | hNOBT reward mining |
| MockERC20 | Test token |

## Tech Stack

- Hardhat (Solidity)
- React + Vite
- thirdweb SDK (frontend)

## Commands

```bash
# Contracts
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network amoy

# Frontend
cd frontend
npm run dev
```
