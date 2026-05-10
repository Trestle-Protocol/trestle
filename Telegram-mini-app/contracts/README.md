# Telegram Mini-App Contracts

Hardhat project with Solidity smart contracts for the Trestle Protocol Telegram Mini-App.

## Contracts

- `MarketplaceCore.sol` — Buy/sell/dispute marketplace logic
- `DigitalGoods.sol` — ERC-721 digital goods listings
- `FreelancerEscrow.sol` — Milestone-based escrow
- `AIDisputeResolver.sol` — AI dispute resolution with submitAndExecute convenience wrapper
- `MockFeeDistributor.sol` — Mock fee distribution for testing

## Commands

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js
```
