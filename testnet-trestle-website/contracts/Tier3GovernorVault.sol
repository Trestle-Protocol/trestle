// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GovernanceToken.sol";

contract Tier3GovernorVault is ERC4626, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error TransferFailed();

    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    GovernanceToken public immutable govToken;

    uint256 private constant ONE_MONTH = 30 days;
    uint256 private constant SIX_MONTHS = 180 days;
    uint256 private constant ONE_YEAR = 365 days;
    uint256 private constant MULT_BASE = 10000;

    uint256 public govPerSecond;
    uint256 public lastUpdate;
    uint256 public accGovPerShare;
    uint256 public accFeePerShare;

    mapping(address => uint256) public stakeTime;
    mapping(address => uint256) public pendingGov;
    mapping(address => uint256) public pendingFee;
    mapping(address => uint256) public debtGov;
    mapping(address => uint256) public debtFee;

    event GovRewardClaimed(address indexed user, uint256 amount);
    event FeeRewardClaimed(address indexed user, uint256 amount);
    event FeeRewardsDeposited(uint256 amount);

    constructor(
        address _lpToken,
        address _govToken
    ) ERC4626(IERC20(_lpToken)) ERC20("Trestle Governor Vault", "xBRT-LP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REWARD_MANAGER_ROLE, msg.sender);

        govToken = GovernanceToken(_govToken);
        lastUpdate = block.timestamp;
    }

    function setGovPerSecond(uint256 _rate) external onlyRole(REWARD_MANAGER_ROLE) {
        _update();
        govPerSecond = _rate;
    }

    function depositFeeRewards() external payable {
        _update();
        if (totalSupply() > 0) {
            unchecked { accFeePerShare += (msg.value * 1e18) / totalSupply(); }
        }
        emit FeeRewardsDeposited(msg.value);
    }

    function _getLoyaltyMultiplier(address user) public view returns (uint256) {
        uint256 stakedAt = stakeTime[user];
        if (stakedAt == 0) return 0;
        unchecked {
            uint256 duration = block.timestamp - stakedAt;
            if (duration >= ONE_YEAR) return MULT_BASE * 2;
            if (duration >= SIX_MONTHS) return (MULT_BASE * 15) / 10;
            if (duration >= ONE_MONTH) return MULT_BASE;
        }
        return 0;
    }

    function _update() private {
        if (totalSupply() == 0) { lastUpdate = block.timestamp; return; }
        uint256 elapsed = block.timestamp - lastUpdate;
        if (elapsed == 0) return;
        unchecked {
            uint256 reward = govPerSecond * elapsed;
            if (reward > 0) accGovPerShare += (reward * 1e18) / totalSupply();
        }
        lastUpdate = block.timestamp;
    }

    function _harvest(address user) private {
        _update();
        uint256 shares = balanceOf(user);
        if (shares == 0) return;
        unchecked {
            uint256 govGross = (shares * accGovPerShare) / 1e18 - debtGov[user];
            uint256 mult = _getLoyaltyMultiplier(user);
            uint256 govNet = (govGross * mult) / MULT_BASE;
            uint256 feeNet = (shares * accFeePerShare) / 1e18 - debtFee[user];
            if (govNet > 0) pendingGov[user] += govNet;
            if (feeNet > 0) pendingFee[user] += feeNet;
            debtGov[user] = (shares * accGovPerShare) / 1e18;
            debtFee[user] = (shares * accFeePerShare) / 1e18;
        }
    }

    function pendingRewards(address user) external view returns (uint256 gov, uint256 fee) {
        uint256 shares = balanceOf(user);
        uint256 _pendingGov = pendingGov[user];
        uint256 _pendingFee = pendingFee[user];
        if (shares == 0) return (_pendingGov, _pendingFee);
        unchecked {
            uint256 elapsed = block.timestamp - lastUpdate;
            uint256 _accGov = accGovPerShare;
            if (totalSupply() > 0 && elapsed > 0 && govPerSecond > 0) {
                _accGov += (govPerSecond * elapsed * 1e18) / totalSupply();
            }
            uint256 govGross = (shares * _accGov) / 1e18 - debtGov[user];
            uint256 mult = _getLoyaltyMultiplier(user);
            _pendingGov += (govGross * mult) / MULT_BASE;
            _pendingFee += (shares * accFeePerShare) / 1e18 - debtFee[user];
        }
        return (_pendingGov, _pendingFee);
    }

    function claimRewards() external nonReentrant {
        _harvest(msg.sender);
        uint256 govAmt = pendingGov[msg.sender];
        uint256 feeAmt = pendingFee[msg.sender];
        if (govAmt > 0) {
            pendingGov[msg.sender] = 0;
            govToken.mint(msg.sender, govAmt);
            emit GovRewardClaimed(msg.sender, govAmt);
        }
        if (feeAmt > 0) {
            pendingFee[msg.sender] = 0;
            (bool s,) = payable(msg.sender).call{value: feeAmt}("");
            if (!s) revert TransferFailed();
            emit FeeRewardClaimed(msg.sender, feeAmt);
        }
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (from != address(0)) _harvest(from);
        super._update(from, to, amount);
        if (to != address(0) && stakeTime[to] == 0) stakeTime[to] = block.timestamp;
    }

    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    receive() external payable {}
}
