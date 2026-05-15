# Reward Contracts

Hardhat project with Solidity contracts for the Trestle Protocol reward hub.

## Contracts

- `BiometricVerification.sol` — Decentralized identity + userSource verification
- `RewardDistributor.sol` — Off-chain signed claims with claim window enforcement

## Key Features

### BiometricVerification.sol
- **Atomic Verification**: Users verify biometrically first, then link/verify accounts in a single transaction
- **Scalable Account Support**: Supports any number of account types (wallet, email, social media, etc.)
- **Percentage-based Scoring**: Sybil score = (verified account types / total supported types) × 100
- **Minimum Requirements**: 
  - Biometric verification required
  - Minimum 3 verified account types for full verification
  - Minimum score threshold: 80/100 for reward eligibility
- **Supported Account Types**: Currently supports up to 10 different account types including:
   - Wallet (MetaMask, WalletConnect, etc.)
   - Email
   - Telegram
   - Discord
   - Forum
   - GitHub
   - Additional platforms (extensible)

### RewardDistributor.sol
- Off-chain signed claims to prevent front-running
- Claim window enforcement
- Replay attack protection
- Owner-controlled verifier key and claim windows

## Commands

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network polygon
```
