// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BiometricVerification
 * @dev Decentralized identity verification to prevent bots and Sybil attacks
 *      Users verify biometrically first, then link/verify accounts atomically
 */
contract BiometricVerification is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    struct UserIdentity {
        bytes32 biometricHash;           // Zero-knowledge proof hash
        uint256 lastVerification;        // Timestamp of last biometric verification
        uint256 sybilScore;              // Calculated sybil resistance score (0-100)
        bool fullyVerified;              // Whether identity is fully verified
        uint256 linkedAccountCount;      // Number of linked account types
        uint256 verifiedAccountCount;    // Number of verified account types
        mapping(string => bool) linkedAccounts;   // Which account types have been linked
        mapping(string => bool) verifiedAccounts; // Which linked accounts have been verified
        mapping(string => bytes32) accountProofs; // Cryptographic proofs for each account type
    }

    mapping(address => UserIdentity) private _identities;
    mapping(bytes32 => bool) private _usedBiometrics; // Prevent replay of biometric hashes
    mapping(address => string) private userSource; // Source of the user (e.g., referral)

    error NotFullyVerified();
    error BiometricAlreadyUsed();
    error InvalidAccountType();
    error InsufficientVerification();

    // Events
    event AccountLinked(address indexed user, string accountType, string identifier);
    event BiometricVerified(address indexed user, bytes32 biometricHash);
    event FullyVerified(address indexed user, uint256 sybilScore);
    event SourceSet(address indexed user, string source);
    event AccountsVerified(address indexed user, string[] accountTypes);

    // Minimum verification requirements for full verification
    uint256 private constant MIN_VERIFIED_ACCOUNTS = 3;
    uint256 private constant MIN_SYBIL_SCORE_FOR_ELIGIBILITY = 80;
    uint256 private constant TOTAL_SUPPORTED_ACCOUNT_TYPES = 10;

    /**
     * @dev Link an account type with proof of ownership (off-chain verified)
     * @param accountType Type of account to link (wallet, email, telegram, etc.)
     * @param identifier The account identifier (email address, telegram handle, etc.)
     * @param proof Cryptographic proof of ownership (signature, etc.)
     */
    function linkAccountWithProof(
        string calldata accountType,
        string calldata identifier,
        bytes32 proof
    ) external {
        if (bytes(accountType).length == 0) revert InvalidAccountType();

        UserIdentity storage id = _identities[msg.sender];

        if (!id.linkedAccounts[accountType]) {
            id.linkedAccountCount++;
            id.linkedAccounts[accountType] = true;
        }

        id.accountProofs[accountType] = proof;

        if (!id.verifiedAccounts[accountType]) {
            id.verifiedAccountCount++;
            id.verifiedAccounts[accountType] = true;
        }

        emit AccountLinked(msg.sender, accountType, identifier);
    }

    /**
     * @dev Submit biometric verification along with account ownership proofs
     * @param biometricHash Zero-knowledge proof hash of biometric data
     * @param accountTypes Array of account types being verified
     * @param identifiers Array of account identifiers
     * @param proofs Array of cryptographic proofs for each account
     */
    function submitBiometricWithAccounts(
        bytes32 biometricHash,
        string[] calldata accountTypes,
        string[] calldata identifiers,
        bytes32[] calldata proofs
    ) external {
        if (_usedBiometrics[biometricHash]) revert BiometricAlreadyUsed();
        if (accountTypes.length != identifiers.length || identifiers.length != proofs.length) {
            revert InvalidAccountType();
        }

        UserIdentity storage id = _identities[msg.sender];
        id.biometricHash = biometricHash;
        id.lastVerification = block.timestamp;

        for (uint256 i = 0; i < accountTypes.length; i++) {
            if (bytes(accountTypes[i]).length == 0) revert InvalidAccountType();

            if (!id.linkedAccounts[accountTypes[i]]) {
                id.linkedAccountCount++;
                id.linkedAccounts[accountTypes[i]] = true;
            }

            id.accountProofs[accountTypes[i]] = proofs[i];

            if (!id.verifiedAccounts[accountTypes[i]]) {
                id.verifiedAccountCount++;
                id.verifiedAccounts[accountTypes[i]] = true;
            }

            emit AccountLinked(msg.sender, accountTypes[i], identifiers[i]);
        }

        id.sybilScore = _calculateSybilScore(id.verifiedAccountCount);

        id.fullyVerified = (id.biometricHash != bytes32(0) &&
                           id.verifiedAccountCount >= MIN_VERIFIED_ACCOUNTS);

        _usedBiometrics[biometricHash] = true;

        emit BiometricVerified(msg.sender, biometricHash);

        if (id.fullyVerified) {
            emit FullyVerified(msg.sender, id.sybilScore);
        }

        if (accountTypes.length > 0) {
            emit AccountsVerified(msg.sender, accountTypes);
        }
    }

    /**
     * @dev Set the source for the user (e.g., referral source)
     * @param source The source identifier
     */
    function setSource(string calldata source) external {
        UserIdentity storage id = _identities[msg.sender];
        if (id.biometricHash == bytes32(0)) revert InsufficientVerification();
        userSource[msg.sender] = source;
        emit SourceSet(msg.sender, source);
    }

    /**
     * @dev Check if user is eligible for rewards
     * @param user Address to check
     * @return true if eligible, false otherwise
     */
    function isEligible(address user) external view returns (bool) {
        UserIdentity storage id = _identities[user];
        return id.fullyVerified &&
               id.sybilScore >= MIN_SYBIL_SCORE_FOR_ELIGIBILITY &&
               block.timestamp - id.lastVerification <= 90 days;
    }

    /**
     * @dev Get user identity information
     * @param user Address to query
     * @return biometricHash Biometric hash
     * @return sybilScore Sybil resistance score
     * @return fullyVerified Whether identity is fully verified
     * @return lastVerification Timestamp of last verification
     */
    function getIdentity(address user) external view returns (
        bytes32 biometricHash,
        uint256 sybilScore,
        bool fullyVerified,
        uint256 lastVerification
    ) {
        UserIdentity storage id = _identities[user];
        return (id.biometricHash, id.sybilScore, id.fullyVerified, id.lastVerification);
    }

    function getLinkedAccountCount(address user) external view returns (uint256) {
        return _identities[user].linkedAccountCount;
    }

    function getVerifiedAccountCount(address user) external view returns (uint256) {
        return _identities[user].verifiedAccountCount;
    }

    function getLinkedAccounts(address user) external view returns (string[] memory) {
        string[] memory accountTypes = new string[](_identities[user].linkedAccountCount);
        return accountTypes;
    }

    function getVerifiedAccounts(address user) external view returns (string[] memory) {
        string[] memory accountTypes = new string[](_identities[user].verifiedAccountCount);
        return accountTypes;
    }

    function isAccountLinked(address user, string memory accountType) external view returns (bool) {
        return _identities[user].linkedAccounts[accountType];
    }

    function isAccountVerified(address user, string memory accountType) external view returns (bool) {
        return _identities[user].verifiedAccounts[accountType];
    }

    function _isFullyVerified(UserIdentity storage id) private view returns (bool) {
        return id.fullyVerified &&
               id.sybilScore >= MIN_SYBIL_SCORE_FOR_ELIGIBILITY &&
               block.timestamp - id.lastVerification <= 90 days;
    }

    function _calculateSybilScore(uint256 verifiedCount) private pure returns (uint256) {
        if (verifiedCount == 0) return 0;
        uint256 score = (verifiedCount * 100) / TOTAL_SUPPORTED_ACCOUNT_TYPES;
        return score > 100 ? 100 : score;
    }
}