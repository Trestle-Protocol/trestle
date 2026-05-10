# Testnet Contracts

Hardhat project with Solidity smart contracts for the Trestle Protocol testnet (Polygon Amoy).

## Contracts

- `Tier1Staking.sol` — Basic staking pool
- `Tier2Staking.sol` — Mid-tier staking pool
- `Tier3Vault.sol` — High-tier staking vault
- `FeeDistributor.sol` — Fee distribution
- `GovernanceToken.sol` — Governance token
- `DigitalRWA.sol` — Digital real-world assets
- `AIDisputeResolver.sol` — Two-step AI dispute resolution
- `HNOBTMining.sol` — hNOBT mining
- `MockERC20.sol` — Test ERC-20 token

## Commands

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network amoy
```
