// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AIDisputeResolver - Off-chain AI Optimized
 * @dev Supports AI signature verification for off-chain dispute resolution
 *      AI models can analyze disputes off-chain and submit signed resolutions
 */
contract AIDisputeResolver is Ownable, ReentrancyGuard {
    error Unauthorized();
    error InvalidSignature();
    error WrongStatus();
    error AlreadyResolved();

    address public verifierKey;
    address public digitalGoods;
    address public freelancerEscrow;

    struct Resolution {
        uint8   kind;       // 0=digital order, 1=freelancer milestone
        uint256 targetId;   // orderId or serviceId
        uint256 extraId;    // 0 for digital, milestoneIndex for freelancer
        bool    result;     // releaseToSeller / releaseToFreelancer
        bytes32 reasonHash;
        uint256 timestamp;
        bool    executed;
    }

    mapping(bytes32 => Resolution) public resolutions;

    event ResolutionSubmitted(bytes32 indexed disputeId, bool result, bytes32 reasonHash);
    event ResolutionExecuted(bytes32 indexed disputeId, uint8 kind, uint256 targetId, bool result);
    event VerifierUpdated(address indexed oldKey, address indexed newKey);

    constructor(
        address _digitalGoods,
        address _freelancerEscrow,
        address _verifierKey
    ) Ownable(msg.sender) {
        digitalGoods = _digitalGoods;
        freelancerEscrow = _freelancerEscrow;
        verifierKey = _verifierKey;
    }

    function setVerifierKey(address _key) external onlyOwner {
        emit VerifierUpdated(verifierKey, _key);
        verifierKey = _key;
    }

    function setTargets(address _dg, address _fe) external onlyOwner {
        digitalGoods = _dg;
        freelancerEscrow = _fe;
    }

    /**
     * @notice Submit resolution from off-chain AI analysis
     * @dev AI model analyzes dispute off-chain, signs result, submits on-chain
     */
    function submitResolution(
        bytes32 disputeId,
        uint8 kind,
        uint256 targetId,
        uint256 extraId,
        bool result,
        bytes32 reasonHash,
        bytes calldata signature
    ) external nonReentrant {
        if (resolutions[disputeId].timestamp != 0) revert WrongStatus();

        bytes32 msgHash = keccak256(abi.encodePacked(disputeId, kind, targetId, extraId, result, reasonHash, block.chainid));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        address recovered = _recover(ethSignedHash, signature);
        if (recovered != verifierKey) revert InvalidSignature();

        resolutions[disputeId] = Resolution(kind, targetId, extraId, result, reasonHash, block.timestamp, false);
        emit ResolutionSubmitted(disputeId, result, reasonHash);
    }

    /**
     * @notice Execute the submitted resolution
     * Can be called by anyone after resolution is submitted
     */
    function executeResolution(bytes32 disputeId) external nonReentrant {
        Resolution storage r = resolutions[disputeId];
        if (r.timestamp == 0 || r.executed) revert AlreadyResolved();
        r.executed = true;

        if (r.kind == 0) {
            IDisputeTarget(digitalGoods).forceResolve(r.targetId, r.result);
        } else {
            IDisputeTarget(freelancerEscrow).forceResolve(r.targetId, r.extraId, r.result);
        }
        emit ResolutionExecuted(disputeId, r.kind, r.targetId, r.result);
    }

    function submitAndExecute(
        bytes32 disputeId,
        uint8 kind,
        uint256 targetId,
        uint256 extraId,
        bool result,
        bytes32 reasonHash,
        bytes calldata signature
    ) external nonReentrant {
        submitResolution(disputeId, kind, targetId, extraId, result, reasonHash, signature);
        executeResolution(disputeId);
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
}

interface IDisputeTarget {
    function forceResolve(uint256 orderId, bool toSeller) external;
    function forceResolve(uint256 serviceId, uint256 milestoneIndex, bool toFreelancer) external;
}