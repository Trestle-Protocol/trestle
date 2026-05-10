// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BiometricVerification
 * @dev Decentralized identity verification to prevent bots and Sybil attacks
 */
contract BiometricVerification is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}
    struct UserIdentity {
        bytes32 biometricHash;
        uint256 lastVerification;
        uint256 sybilScore;
        bool fullyVerified;
        mapping(string => bool) linkedAccounts;
        mapping(string => bool) verifiedAccounts;
    }

    mapping(address => UserIdentity) private _identities;
    mapping(bytes32 => bool) private _usedBiometrics;

    error NotFullyVerified();
    error BiometricAlreadyUsed();
    error InvalidAccountType();

    mapping(address => string) public userSource;

    event AccountLinked(address indexed user, string accountType, string identifier);
    event BiometricVerified(address indexed user, bytes32 biometricHash);
    event FullyVerified(address indexed user, uint256 sybilScore);
    event SourceSet(address indexed user, string source);

    function linkAccount(string calldata accountType, string calldata identifier) external {
        if (keccak256(bytes(accountType)) != keccak256(bytes("wallet")) &&
            keccak256(bytes(accountType)) != keccak256(bytes("email")) &&
            keccak256(bytes(accountType)) != keccak256(bytes("telegram")) &&
            keccak256(bytes(accountType)) != keccak256(bytes("twitter")) &&
            keccak256(bytes(accountType)) != keccak256(bytes("discord")) &&
            keccak256(bytes(accountType)) != keccak256(bytes("forum"))) {
            revert InvalidAccountType();
        }

        _identities[msg.sender].linkedAccounts[accountType] = true;
        emit AccountLinked(msg.sender, accountType, identifier);
    }

    function submitBiometric(bytes32 biometricHash, string[] calldata linkedIdentifiers) external {
        if (_usedBiometrics[biometricHash]) revert BiometricAlreadyUsed();

        UserIdentity storage id = _identities[msg.sender];
        id.biometricHash = biometricHash;
        id.lastVerification = block.timestamp;

        // Mark accounts as verified
        for (uint i = 0; i < linkedIdentifiers.length; i++) {
            id.verifiedAccounts[linkedIdentifiers[i]] = true;
        }

        // Calculate Sybil score
        id.sybilScore = _calculateSybilScore(linkedIdentifiers.length);
        id.fullyVerified = _isFullyVerified(id);

        _usedBiometrics[biometricHash] = true;

        emit BiometricVerified(msg.sender, biometricHash);
        if (id.fullyVerified) {
            emit FullyVerified(msg.sender, id.sybilScore);
        }
    }

    function setSource(string calldata source) external {
        userSource[msg.sender] = source;
        emit SourceSet(msg.sender, source);
    }

    function isEligible(address user) external view returns (bool) {
        UserIdentity storage id = _identities[user];
        return id.fullyVerified && 
               id.sybilScore >= 80 &&
               block.timestamp - id.lastVerification <= 90 days;
    }

    function getIdentity(address user) external view returns (
        bytes32 biometricHash,
        uint256 sybilScore,
        bool fullyVerified,
        uint256 lastVerification
    ) {
        UserIdentity storage id = _identities[user];
        return (id.biometricHash, id.sybilScore, id.fullyVerified, id.lastVerification);
    }

    function _isFullyVerified(UserIdentity storage id) private view returns (bool) {
        uint verifiedCount = 0;
        // Check if key accounts are verified
        // In production, this would iterate dynamically
        if (id.verifiedAccounts["wallet"]) verifiedCount++;
        if (id.verifiedAccounts["email"]) verifiedCount++;
        if (id.verifiedAccounts["telegram"]) verifiedCount++;

        return verifiedCount >= 3 && id.biometricHash != bytes32(0);
    }

    function _calculateSybilScore(uint linkedCount) private pure returns (uint256) {
        // Base score from linked accounts
        uint256 score = linkedCount * 15;
        // Cap at 100
        return score > 100 ? 100 : score;
    }
}