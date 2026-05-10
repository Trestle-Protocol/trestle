// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20, Ownable {
    error NotMinter();
    error EmissionEnded();
    error SupplyCapExceeded();
    error ZeroAmount();
    error InsufficientBalance();

    uint256 public immutable maxSupply;
    uint256 public immutable emissionEnd;
    address public minter;

    event MinterUpdated(address indexed minter);
    event Burned(address indexed from, uint256 amount);

    constructor(uint256 _maxSupply, uint256 _emissionDuration) ERC20("Trestle Governance", "GOV") Ownable(msg.sender) {
        maxSupply = _maxSupply;
        emissionEnd = block.timestamp + _emissionDuration;
        minter = msg.sender;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
        emit MinterUpdated(_minter);
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != minter) revert NotMinter();
        if (block.timestamp >= emissionEnd) revert EmissionEnded();
        if (totalSupply() + amount > maxSupply) revert SupplyCapExceeded();
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(from) < amount) revert InsufficientBalance();
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        emit Burned(from, amount);
    }
}
