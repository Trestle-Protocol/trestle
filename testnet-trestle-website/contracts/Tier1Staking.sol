// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Tier1Staking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAmount();
    error InvalidDuration();
    error Locked();
    error NoReward();
    error NothingToUnstake();

    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    IERC20 public immutable stakingToken;   // hNOBT
    IERC20 public immutable rewardToken;    // BroilerPlus (5% tax per transfer)

    uint256 private constant TAX_BPS = 500;     // 5%
    uint256 private constant TAX_ADJ = 10000;   // gross-up: net * 10000 / (10000 - 500)

    uint8 public constant DURATION_3MO  = 0;
    uint8 public constant DURATION_6MO  = 1;
    uint8 public constant DURATION_12MO = 2;

    struct Pool {
        uint256 totalStaked;
        uint256 rewardPerSecond;
        uint256 lastUpdate;
        uint256 accPerShare;
        uint256 lockDuration;
    }

    struct Position {
        uint256 amount;
        uint256 debt;
        uint256 startTime;
        uint8 poolId;
    }

    Pool[3] public pools;
    mapping(address => Position[]) public positions;

    event Staked(address indexed user, uint256 amount, uint8 poolId);
    event Unstaked(address indexed user, uint256 amount, uint256 posIndex);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address _staking, address _reward) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);

        stakingToken = IERC20(_staking);
        rewardToken = IERC20(_reward);
        pools[0] = Pool(0, 0, block.timestamp, 0, 90 days);
        pools[1] = Pool(0, 0, block.timestamp, 0, 180 days);
        pools[2] = Pool(0, 0, block.timestamp, 0, 365 days);
    }

    function setPoolReward(uint8 poolId, uint256 rps) external onlyRole(REWARD_MANAGER_ROLE) {
        _updatePool(poolId);
        pools[poolId].rewardPerSecond = rps;
    }

    function _updatePool(uint8 pid) private {
        Pool storage p = pools[pid];
        if (p.totalStaked == 0) { p.lastUpdate = block.timestamp; return; }
        uint256 elapsed = block.timestamp - p.lastUpdate;
        if (elapsed == 0) return;
        unchecked {
            uint256 reward = p.rewardPerSecond * elapsed;
            p.accPerShare += (reward * 1e18) / p.totalStaked;
        }
        p.lastUpdate = block.timestamp;
    }

    function _pending(uint8 pid, uint256 amount, uint256 debt) private view returns (uint256) {
        Pool storage p = pools[pid];
        if (p.totalStaked == 0) return 0;
        uint256 elapsed = block.timestamp - p.lastUpdate;
        uint256 reward = p.rewardPerSecond * elapsed;
        uint256 acc = p.accPerShare + (reward * 1e18) / p.totalStaked;
        return (amount * acc) / 1e18 - debt;
    }

    function stake(uint256 amount, uint8 duration) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (duration > DURATION_12MO) revert InvalidDuration();
        _updatePool(duration);
        Pool storage p = pools[duration];
        positions[msg.sender].push();
        Position storage pos = positions[msg.sender][positions[msg.sender].length - 1];
        pos.amount = amount;
        pos.debt = (amount * p.accPerShare) / 1e18;
        pos.startTime = block.timestamp;
        pos.poolId = duration;
        p.totalStaked += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, duration);
    }

    function unstake(uint256 posIndex) external nonReentrant {
        Position storage pos = positions[msg.sender][posIndex];
        if (pos.amount == 0) revert NothingToUnstake();
        Pool storage p = pools[pos.poolId];
        if (block.timestamp < pos.startTime + p.lockDuration) revert Locked();
        _updatePool(pos.poolId);
        uint256 pending = (pos.amount * p.accPerShare) / 1e18 - pos.debt;
        uint256 amt = pos.amount;
        pos.amount = 0;
        pos.debt = 0;
        p.totalStaked -= amt;
        stakingToken.safeTransfer(msg.sender, amt);
        if (pending > 0) {
            rewardToken.safeTransfer(msg.sender, _gross(pending));
            emit RewardClaimed(msg.sender, pending);
        }
        emit Unstaked(msg.sender, amt, posIndex);
    }

    function _gross(uint256 net) private pure returns (uint256) {
        return net * TAX_ADJ / (TAX_ADJ - TAX_BPS);
    }

    function claimReward(uint256 posIndex) external nonReentrant {
        Position storage pos = positions[msg.sender][posIndex];
        if (pos.amount == 0) revert NothingToUnstake();
        _updatePool(pos.poolId);
        Pool storage p = pools[pos.poolId];
        uint256 pending = (pos.amount * p.accPerShare) / 1e18 - pos.debt;
        if (pending == 0) revert NoReward();
        pos.debt = (pos.amount * p.accPerShare) / 1e18;
        rewardToken.safeTransfer(msg.sender, _gross(pending));
        emit RewardClaimed(msg.sender, pending);
    }

    function pendingReward(address user, uint256 posIndex) external view returns (uint256) {
        if (posIndex >= positions[user].length) return 0;
        Position storage pos = positions[user][posIndex];
        if (pos.amount == 0) return 0;
        return _pending(pos.poolId, pos.amount, pos.debt);
    }

    function userPositionCount(address user) external view returns (uint256) {
        return positions[user].length;
    }

    function getPoolInfo(uint8 pid) external view returns (Pool memory) {
        return pools[pid];
    }
}
