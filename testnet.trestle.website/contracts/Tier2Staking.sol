// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Tier2Staking is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error ZeroAmount();
    error InvalidAmount();
    error NoReward();

    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    IERC20 public immutable lpToken;
    IERC20 public immutable rewardToken;    // BroilerPlus (5% tax per transfer)

    uint256 private constant TAX_BPS = 500;
    uint256 private constant TAX_ADJ = 10000;

    uint256 public rewardPerSecond;
    uint256 public lastUpdate;
    uint256 public accPerShare;
    uint256 public totalStaked;

    struct UserInfo {
        uint256 amount;
        uint256 debt;
    }

    mapping(address => UserInfo) public userInfo;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address _lp, address _reward) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);

        lpToken = IERC20(_lp);
        rewardToken = IERC20(_reward);
    }

    function setRewardPerSecond(uint256 _rps) external onlyRole(REWARD_MANAGER_ROLE) {
        _update();
        rewardPerSecond = _rps;
    }

    function _update() private {
        if (totalStaked == 0) { lastUpdate = block.timestamp; return; }
        uint256 elapsed = block.timestamp - lastUpdate;
        if (elapsed == 0) return;
        unchecked {
            uint256 reward = rewardPerSecond * elapsed;
            accPerShare += (reward * 1e18) / totalStaked;
        }
        lastUpdate = block.timestamp;
    }

    function pendingReward(address user) external view returns (uint256) {
        UserInfo memory u = userInfo[user];
        if (totalStaked == 0 || u.amount == 0) return 0;
        uint256 elapsed = block.timestamp - lastUpdate;
        uint256 reward = rewardPerSecond * elapsed;
        uint256 acc = accPerShare + (reward * 1e18) / totalStaked;
        return (u.amount * acc) / 1e18 - u.debt;
    }

    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _update();
        UserInfo storage u = userInfo[msg.sender];
        u.amount += amount;
        u.debt = (u.amount * accPerShare) / 1e18;
        totalStaked += amount;
        lpToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function _gross(uint256 net) private pure returns (uint256) {
        return net * TAX_ADJ / (TAX_ADJ - TAX_BPS);
    }

    function unstake(uint256 amount) external nonReentrant {
        UserInfo storage u = userInfo[msg.sender];
        if (amount == 0 || amount > u.amount) revert InvalidAmount();
        _update();
        unchecked {
            u.amount -= amount;
            totalStaked -= amount;
        }
        u.debt = (u.amount * accPerShare) / 1e18;
        lpToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external nonReentrant {
        _update();
        UserInfo storage u = userInfo[msg.sender];
        uint256 pending = (u.amount * accPerShare) / 1e18 - u.debt;
        if (pending == 0) revert NoReward();
        u.debt = (u.amount * accPerShare) / 1e18;
        rewardToken.safeTransfer(msg.sender, _gross(pending));
        emit RewardClaimed(msg.sender, pending);
    }
}
