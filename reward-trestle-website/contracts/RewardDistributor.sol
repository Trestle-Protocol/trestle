// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBiometricVerification {
    function isEligible(address user) external view returns (bool);
}

contract RewardDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error NotEligible();
    error InvalidSignature();
    error ClaimPeriodNotOpen();
    error AlreadyClaimed();
    error NothingToClaim();

    IBiometricVerification public immutable biometric;
    IERC20 public immutable rewardToken;
    address public verifierKey;

    uint256 public claimWindowStart;
    uint256 public claimInterval;

    mapping(address => uint256) public lastClaimTime;
    mapping(bytes32 => bool) public usedClaims;

    event Claimed(address indexed user, uint256 amount, bytes32 indexed claimId);
    event VerifierUpdated(address indexed oldKey, address indexed newKey);
    event ClaimWindowSet(uint256 start, uint256 interval);

    constructor(
        address _biometric,
        address _rewardToken,
        address _verifierKey,
        address _owner
    ) Ownable(_owner) {
        biometric = IBiometricVerification(_biometric);
        rewardToken = IERC20(_rewardToken);
        verifierKey = _verifierKey;
    }

    function setVerifierKey(address _key) external onlyOwner {
        emit VerifierUpdated(verifierKey, _key);
        verifierKey = _key;
    }

    function setClaimWindow(uint256 start, uint256 interval) external onlyOwner {
        claimWindowStart = start;
        claimInterval = interval;
        emit ClaimWindowSet(start, interval);
    }

    function claim(
        uint256 amount,
        bytes32 claimId,
        bytes calldata signature
    ) external nonReentrant {
        if (!biometric.isEligible(msg.sender)) revert NotEligible();
        if (usedClaims[claimId]) revert AlreadyClaimed();
        if (amount == 0) revert NothingToClaim();
        if (block.timestamp < claimWindowStart) revert ClaimPeriodNotOpen();
        if (lastClaimTime[msg.sender] + claimInterval > block.timestamp) revert ClaimPeriodNotOpen();

        bytes32 msgHash = keccak256(abi.encodePacked(msg.sender, amount, claimId, block.chainid));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        if (_recover(ethSignedHash, signature) != verifierKey) revert InvalidSignature();

        usedClaims[claimId] = true;
        lastClaimTime[msg.sender] = block.timestamp;

        rewardToken.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount, claimId);
    }

    function _recover(bytes32 hash, bytes calldata sig) private pure returns (address) {
        if (sig.length != 65) revert InvalidSignature();
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 0x20))
            v := byte(0, calldataload(add(sig.offset, 0x40)))
        }
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) revert InvalidSignature();
        if (v < 27) v += 27;
        return ecrecover(hash, v, r, s);
    }

    function fundRewards(uint256 amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
