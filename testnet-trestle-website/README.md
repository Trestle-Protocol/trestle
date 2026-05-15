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

## 📬 Contact
- **Website**: [https://trestle.website](https://trestle.website)
- **GitHub**: [Trestle Protocol](https://github.com/Trestle-Protocol)
- **Discord**: [Trestle Protocol](https://discord.gg/4dCCvnJYGT)
- **Telegram**: [Trestle Pro](https://t.m/TrestlePro)
- **Email**: contact@trestle.website
