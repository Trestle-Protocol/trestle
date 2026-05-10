// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IFeeDistributor.sol";

contract MarketplaceCore is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error Unauthorized();
    error NothingToWithdraw();
    error TransferFailed();

    uint256 public constant FEE_BPS = 300;
    uint256 public constant BPS_DENOM = 10000;

    IFeeDistributor public feeDistributor;
    mapping(address => mapping(address => uint256)) public pendingWithdrawals;
    mapping(address => bool) public approvedModules;

    event FeeDistributed(address indexed token, uint256 amount);
    event ModuleApproved(address indexed module, bool approved);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);

    constructor(address initialOwner, address _feeDistributor) Ownable(initialOwner) {
        feeDistributor = IFeeDistributor(_feeDistributor);
    }

    function setFeeDistributor(address _fd) external onlyOwner {
        feeDistributor = IFeeDistributor(_fd);
    }

    function setModule(address module, bool approved) external onlyOwner {
        approvedModules[module] = approved;
        emit ModuleApproved(module, approved);
    }

    function distributeFee(address token, uint256 amount) external {
        if (!approvedModules[msg.sender]) revert Unauthorized();
        if (amount == 0) return;
        if (token == address(0)) {
            (bool s,) = address(feeDistributor).call{value: amount}("");
            if (!s) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(address(feeDistributor), amount);
        }
        feeDistributor.distribute(token, amount);
        emit FeeDistributed(token, amount);
    }

    function addPendingWithdrawal(address user, address token, uint256 amount) external {
        if (!approvedModules[msg.sender]) revert Unauthorized();
        if (amount == 0) return;
        pendingWithdrawals[user][token] += amount;
    }

    function withdraw(address token) external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender][token];
        if (amount == 0) revert NothingToWithdraw();
        pendingWithdrawals[msg.sender][token] = 0;
        if (token == address(0)) {
            (bool s,) = payable(msg.sender).call{value: amount}("");
            if (!s) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
        emit Withdrawn(msg.sender, token, amount);
    }

    receive() external payable {}
}
