// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FeeDistributor is Ownable {
    using SafeERC20 for IERC20;

    error Unauthorized();
    error NoAmount();

    uint256 private constant BPS = 10000;
    uint256 private constant YIELD_BPS = 4000;
    uint256 private constant TREASURY_BPS = 4000;
    uint256 private constant BUYBACK_BPS = 2000;

    address public yieldVault;
    address public treasury;
    address public buybackBurn;

    event Distributed(address indexed token, uint256 amount);
    event YieldShare(address indexed token, uint256 amount);
    event TreasuryShare(address indexed token, uint256 amount);
    event BuybackShare(address indexed token, uint256 amount);
    event YieldVaultUpdated(address vault);
    event TreasuryUpdated(address treasury);
    event BuybackUpdated(address buyback);

    constructor(address _treasury) Ownable(msg.sender) {
        treasury = _treasury;
    }

    function setYieldVault(address _yieldVault) external onlyOwner {
        yieldVault = _yieldVault;
        emit YieldVaultUpdated(_yieldVault);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setBuybackBurn(address _buybackBurn) external onlyOwner {
        buybackBurn = _buybackBurn;
        emit BuybackUpdated(_buybackBurn);
    }

    function distribute(address token, uint256 amount) external {
        if (msg.sender != owner() && msg.sender != yieldVault) revert Unauthorized();
        if (amount == 0) revert NoAmount();

        unchecked {
            uint256 ys = (amount * YIELD_BPS) / BPS;
            uint256 ts = (amount * TREASURY_BPS) / BPS;
            uint256 bs = amount - ys - ts;

            if (ys > 0)  { _transfer(token, yieldVault, ys);  emit YieldShare(token, ys); }
            if (ts > 0)  { _transfer(token, treasury, ts);    emit TreasuryShare(token, ts); }
            if (bs > 0)  { _transfer(token, buybackBurn, bs); emit BuybackShare(token, bs); }
            emit Distributed(token, amount);
        }
    }

    function _transfer(address token, address to, uint256 amount) private {
        if (to == address(0) || amount == 0) return;
        if (token == address(0)) {
            (bool s,) = payable(to).call{value: amount}("");
            if (!s) revert("ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
