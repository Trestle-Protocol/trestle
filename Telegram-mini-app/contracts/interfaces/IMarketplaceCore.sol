// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMarketplaceCore {
    function FEE_BPS() external view returns (uint256);
    function BPS_DENOM() external view returns (uint256);
    function feeDistributor() external view returns (address);
    function pendingWithdrawals(address user, address token) external view returns (uint256);
    function approvedModules(address module) external view returns (bool);
    function owner() external view returns (address);

    function distributeFee(address token, uint256 amount) external;
    function addPendingWithdrawal(address user, address token, uint256 amount) external;
    function withdraw(address token) external;
}
