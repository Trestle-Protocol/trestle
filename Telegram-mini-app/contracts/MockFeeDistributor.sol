// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IFeeDistributor.sol";

contract MockFeeDistributor is IFeeDistributor {
    event Distributed(address token, uint256 amount);

    function distribute(address token, uint256 amount) external override {
        emit Distributed(token, amount);
    }

    receive() external payable {}
}
