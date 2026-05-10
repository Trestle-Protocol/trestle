// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DigitalRWA - Optimized for Testnet
 * @dev Gas-optimized version of DigitalRWA for testnet deployment
 */
contract DigitalRWA is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bytes32 public assetMetaURI;
    uint256 public immutable supplyCap;
    mapping(address => bool) public whitelisted;

    event MetadataUpdated(bytes32 newURI);
    event Whitelisted(address indexed account, bool status);

    constructor(
        string memory _name,
        string memory _symbol,
        bytes32 _metaURI,
        uint256 _supplyCap,
        address _owner
    ) ERC20(_name, _symbol) {
        require(_owner != address(0) && _supplyCap > 0, "Invalid params");
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(MINTER_ROLE, _owner);
        _grantRole(PAUSER_ROLE, _owner);
        assetMetaURI = _metaURI;
        supplyCap = _supplyCap;
    }

    modifier onlyWhitelisted(address account) {
        require(whitelisted[account], "Not whitelisted");
        _;
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0) && amount > 0, "Invalid");
        require(totalSupply() + amount <= supplyCap, "Cap exceeded");
        _mint(to, amount);
    }

    function setWhitelist(address account, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Zero address");
        whitelisted[account] = status;
        emit Whitelisted(account, status);
    }

    function updateMetaURI(bytes32 _newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assetMetaURI = _newURI;
        emit MetadataUpdated(_newURI);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        if (from != address(0)) require(whitelisted[from], "From not whitelisted");
        if (to != address(0)) require(whitelisted[to], "To not whitelisted");
        super._update(from, to, value);
    }
}