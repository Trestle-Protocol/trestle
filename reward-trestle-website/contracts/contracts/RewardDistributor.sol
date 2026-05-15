// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBiometricVerification {
    function isEligible(address user) external view returns (bool);
}

/**
 * @title RewardDistributor
 * @dev Handles reward distribution with off-chain signed claims.
 *      Users submit signed claims to prevent front-running and ensure fairness.
 *      Gasless: Relayers can submit claims on behalf of users by paying gas.
 */
contract RewardDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error AlreadyClaimed();
    error NothingToClaim();
    error InvalidVerifierKey();
    error NotEligible();
    error ClaimPeriodNotOpen();
    error InvalidSignature();
    error InvalidAmount();
    error MaxClaimExceeded();

    IBiometricVerification public immutable biometric;
    IERC20 public immutable rewardToken;

    address public verifierKey;

    uint256 public claimWindowStart;
    uint256 public claimInterval;
    uint256 public maxClaimAmount;

    mapping(address => uint256) public lastClaimTime;
    mapping(bytes32 => bool) public usedClaims;

    event Claimed(address indexed user, uint256 amount, bytes32 indexed claimId);
    event VerifierUpdated(address indexed oldKey, address indexed newKey);
    event ClaimWindowSet(uint256 start, uint256 interval);
    event FundsAdded(address indexed from, uint256 amount);
    event MaxClaimAmountSet(uint256 amount);

    constructor(
        address _biometric,
        address _rewardToken,
        address _owner
    ) Ownable(_owner) {
        biometric = IBiometricVerification(_biometric);
        rewardToken = IERC20(_rewardToken);
    }

    function setVerifierKey(address _key) external onlyOwner {
        require(_key != address(0), "Verifier key cannot be zero address");
        emit VerifierUpdated(verifierKey, _key);
        verifierKey = _key;
    }

    function setClaimWindow(uint256 start, uint256 interval) external onlyOwner {
        require(interval > 0, "Claim interval must be greater than zero");
        claimWindowStart = start;
        claimInterval = interval;
        emit ClaimWindowSet(start, interval);
    }

    function setMaxClaimAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Max claim amount must be greater than zero");
        maxClaimAmount = amount;
        emit MaxClaimAmountSet(amount);
    }

    /**
     * @dev Claim rewards with off-chain signature (gasless for user)
     * @param amount Amount of reward tokens to claim
     * @param claimId Unique identifier for this claim (to prevent replay)
     * @param signature ECDSA signature from verifier key
     */
    function claim(
        uint256 amount,
        bytes32 claimId,
        bytes calldata signature
    ) external nonReentrant {
        _verifyAndClaim(msg.sender, amount, claimId, signature);
    }

    /**
     * @dev Claim rewards on behalf of another user (gasless for recipient)
     * @param recipient Address of the user to claim for
     * @param amount Amount of reward tokens to claim
     * @param claimId Unique identifier for this claim (to prevent replay)
     * @param signature ECDSA signature from verifier key
     */
    function claimOnBehalf(
        address recipient,
        uint256 amount,
        bytes32 claimId,
        bytes calldata signature
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient address");
        _verifyAndClaim(recipient, amount, claimId, signature);
    }

    function _verifyAndClaim(
        address user,
        uint256 amount,
        bytes32 claimId,
        bytes calldata signature
    ) private {
        if (amount == 0) revert NothingToClaim();
        if (maxClaimAmount > 0 && amount > maxClaimAmount) revert MaxClaimExceeded();
        if (usedClaims[claimId]) revert AlreadyClaimed();

        if (!biometric.isEligible(user)) revert NotEligible();

        if (block.timestamp < claimWindowStart) revert ClaimPeriodNotOpen();
        if (lastClaimTime[user] + claimInterval > block.timestamp) revert ClaimPeriodNotOpen();

        bytes32 msgHash = keccak256(abi.encodePacked(user, amount, claimId, block.chainid));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        address recoveredKey = _recover(ethSignedHash, signature);

        if (verifierKey == address(0)) revert InvalidVerifierKey();
        if (recoveredKey != verifierKey) revert InvalidSignature();

        usedClaims[claimId] = true;
        lastClaimTime[user] = block.timestamp;

        rewardToken.safeTransfer(user, amount);
        emit Claimed(user, amount, claimId);
    }

    function _recover(bytes32 hash, bytes calldata sig) private pure returns (address) {
        if (sig.length != 65) revert InvalidSignature();
        bytes32 r = bytes32(sig[0:32]);
        bytes32 s = bytes32(sig[32:64]);
        uint8 v = uint8(sig[64]) + 27;
        return ecrecover(hash, v, r, s);
    }

    function fundRewards(uint256 amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        emit FundsAdded(msg.sender, amount);
    }
}