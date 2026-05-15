# Trestle Reward Hub - Decentralized Identity Verification

## Overview
The Reward Hub implements **decentralized biometric verification** to prevent bots, Sybil attacks, and airdrop farming from day one. Users can join/login with all available methods (wallet, email, social), but only users that link all their identities to biometric verification can earn/claim rewards.

## Key Features

### 1. Multi-Method Authentication
- **Wallet Login**: MetaMask, WalletConnect, Account Abstraction
- **Email Login**: With magic link verification
- **Social Login**: Telegram, Google, Discord
- **Biometric Verification**: Required for reward eligibility

### 2. Decentralized Identity Binding
```
User Identity = {
  wallets: [0x..., ...],           // Linked wallets
  emails: ["user@email.com"],       // Verified emails
  socials: {                        // Social accounts
    telegram: "@username",
    discord: "Trestle Protocol",
    discord: "username#1234"
  },
  biometricHash: "0xhash...",       // Verified biometric signature
  sybilScore: 95,                   // Sybil resistance score (0-100)
  verified: true,                  // All linked = eligible
  lastVerification: timestamp
}
```

### 3. Biometric Verification Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BiometricVerification {
    struct UserIdentity {
        bytes32 biometricHash;      // Zero-knowledge proof hash
        mapping(string => bool) linkedAccounts;
        mapping(string => bool) verifiedAccounts;
        uint256 sybilScore;
        bool fullyVerified;
        uint256 lastVerification;
    }

    mapping(address => UserIdentity) public identities;
    mapping(bytes32 => bool) public usedBiometrics;  // Prevent replay

    error NotFullyVerified();
    error BiometricAlreadyUsed();

    /**
     * @dev Link an account (wallet/email/social) to user's identity
     */
    function linkAccount(string calldata accountType, string calldata identifier) external {
        identities[msg.sender].linkedAccounts[accountType] = true;
    }

    /**
     * @dev Submit biometric verification (zk-proof based)
     */
    function submitBiometric(
        bytes32 biometricHash,
        bytes calldata zkProof,
        string[] calldata linkedIdentifiers
    ) external {
        if (usedBiometrics[biometricHash]) revert BiometricAlreadyUsed();

        // Verify ZK proof (off-chain verification + on-chain check)
        require(verifyZKProof(msg.sender, biometricHash, zkProof, linkedIdentifiers));

        UserIdentity storage id = identities[msg.sender];
        id.biometricHash = biometricHash;
        id.lastVerification = block.timestamp;

        // Mark all linked accounts as verified
        for (uint i = 0; i < linkedIdentifiers.length; i++) {
            id.verifiedAccounts[linkedIdentifiers[i]] = true;
        }

        // Calculate Sybil resistance score
        id.sybilScore = calculateSybilScore(linkedIdentifiers.length);
        id.fullyVerified = isFullyVerified(id);

        usedBiometrics[biometricHash] = true;
    }

    /**
     * @dev Check if user is eligible for rewards
     */
    function isEligible(address user) external view returns (bool) {
        return identities[user].fullyVerified && 
               identities[user].sybilScore >= 80 &&
               block.timestamp - identities[user].lastVerification < 90 days;
    }

    function isFullyVerified(UserIdentity storage id) private view returns (bool) {
        uint verifiedCount = 0;
        // Must have verified: wallet + email + social + biometric
        if (id.verifiedAccounts["wallet"]) verifiedCount++;
        if (id.verifiedAccounts["email"]) verifiedCount++;
        if (id.verifiedAccounts["telegram"]) verifiedCount++;

        return verifiedCount >= 3 && id.biometricHash != bytes32(0);
    }
}
```

### 4. Sybil Attack Prevention

#### Detection Mechanisms:
1. **Device Fingerprinting**: Track devices used for verification
2. **IP Analysis**: Flag unusual login patterns
3. **Behavior Analysis**: Monitor for bot-like activity
4. **Social Graph Analysis**: Check for coordinated fake accounts

#### Scoring System:
- Each linked, verified account = +10 points
- Biometric verification = +50 points
- Activity consistency = +10-30 points
- Minimum score for rewards = 80/100

### 5. Reward Distribution Rules

```solidity
modifier onlyEligible() {
    if (!biometricVerification.isEligible(msg.sender)) {
        revert NotFullyVerified();
    }
    _;
}

function claimReward(uint256 taskId) external onlyEligible {
    // User can claim reward only if fully verified
    rewardToken.transfer(msg.sender, rewardAmount);
    claimedTasks[msg.sender][taskId] = true;
    emit RewardClaimed(msg.sender, taskId);
}
```

### 6. Frontend Integration

#### Verification Flow:
```javascript
// 1. User connects wallet
// 2. User links email via magic link
// 3. User connects Telegram/Discord
// 4. User completes biometric verification (camera/fingerprint)
// 5. ZK proof generated client-side
// 6. All linked to single identity
```

#### Dashboard Components:
- **Identity Status**: Shows which accounts are linked/verified
- **Verification Progress**: Visual progress bar
- **Reward Balance**: Available rewards
- **Task History**: Completed and claimable tasks
- **Sybil Score**: Current resistance rating

### 7. Privacy Preservation
- **Zero-Knowledge Proofs**: Biometric data never stored on-chain
- **Hash-based Verification**: Only cryptographic hashes stored
- **Off-chain Storage**: Encrypted biometric templates stored on IPFS/Filecoin
- **User Control**: Users can revoke verification anytime

### 8. Files Structure
```
reward.trestle.website/
├── contracts/
│   ├── BiometricVerification.sol
│   ├── RewardDistributor.sol
│   └── TaskManager.sol
├── frontend/
│   ├── components/
│   │   ├── IdentityLinker.tsx
│   │   ├── BiometricScanner.tsx
│   │   └── RewardDashboard.tsx
│   └── pages/
│       ├── dashboard.tsx
│       ├── verify.tsx
│       └── tasks.tsx
└── lib/
    ├── sybilDetection.ts
    └── zkProofGenerator.ts
```

### 9. Anti-Bot Measures

| Attack Type | Detection Method | Prevention |
|-------------|------------------|------------|
| Bot Farms | Behavior analysis | CAPTCHA + biometric |
| Sybil Attacks | Identity linking | Multi-account verification |
| Airdrop Farming | IP/device tracking | Rate limiting + verification |
| Referral Spam | Graph analysis | Verified referral only |

---

## 📬 Contact
- **Website**: [https://trestle.website](https://trestle.website)
- **GitHub**: [Trestle Protocol](https://github.com/Trestle-Protocol)
- **Discord**: [Trestle Protocol](https://discord.gg/4dCCvnJYGT)
- **Telegram**: [Trestle Pro](https://t.m/TrestlePro)
- **Email**: contact@trestle.website