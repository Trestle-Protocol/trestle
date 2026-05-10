// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMarketplaceCore.sol";

contract DigitalGoods is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error Unauthorized();
    error InvalidInput();
    error NotActive();
    error SelfPurchase();
    error WrongStatus();

    IMarketplaceCore public immutable core;
    uint256 private constant AUTO_RESOLVE = 7 days;

    enum OS { Pending, Fulfilled, Disputed, Refunded, Resolved }

    struct Listing {
        uint96  id;
        address seller;
        uint128 price;
        address token;
        bytes32 metaURI;
        bool    active;
        uint40  createdAt;
    }

    struct Order {
        uint96  id;
        uint96  listingId;
        address buyer;
        uint128 amount;
        uint64  fee;
        uint64  netAmount;
        OS      status;
        uint40  expiresAt;
    }

    uint96  public listingCounter;
    uint96  public orderCounter;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Order)   public orders;

    event List(uint256 indexed id, address indexed seller, bytes32 metaURI, uint128 price, address token);
    event Buy(uint256 indexed orderId, uint256 indexed listingId, address indexed buyer, uint128 amount);
    event Confirm(uint256 indexed orderId, address indexed buyer);
    event Dispute(uint256 indexed orderId, address indexed initiator);

    constructor(address _core) { core = IMarketplaceCore(_core); }

    function listItem(bytes32 metaURI, uint128 price, address token) external returns (uint256) {
        if (price == 0 || metaURI == bytes32(0)) revert InvalidInput();
        unchecked { ++listingCounter; }
        uint96 id = listingCounter;
        Listing storage l = listings[id];
        l.id = id; l.seller = msg.sender; l.price = price; l.token = token;
        l.metaURI = metaURI; l.active = true; l.createdAt = uint40(block.timestamp);
        emit List(id, msg.sender, metaURI, price, token);
        return id;
    }

    function updatePrice(uint256 listingId, uint128 price) external {
        Listing storage l = listings[listingId];
        if (l.id == 0) revert InvalidInput();
        if (l.seller != msg.sender) revert Unauthorized();
        l.price = price;
    }

    function toggleActive(uint256 listingId) external {
        Listing storage l = listings[listingId];
        if (l.id == 0) revert InvalidInput();
        if (l.seller != msg.sender) revert Unauthorized();
        l.active = !l.active;
    }

    function buyItem(uint256 listingId) external payable nonReentrant returns (uint256) {
        Listing storage l = listings[listingId];
        if (l.id == 0) revert InvalidInput();
        if (!l.active) revert NotActive();
        if (l.seller == msg.sender) revert SelfPurchase();
        uint128 price = l.price;
        unchecked {
            uint64 fee = uint64((uint256(price) * core.FEE_BPS()) / core.BPS_DENOM());
            uint64 net = uint64(uint256(price) - fee);
            _pull(l.token, price);
            _fwd(l.token, price);
            ++orderCounter;
            uint96 id = orderCounter;
            orders[id] = Order(id, uint96(listingId), msg.sender, price, fee, net, OS.Pending, uint40(block.timestamp + AUTO_RESOLVE));
            emit Buy(id, listingId, msg.sender, price);
            return id;
        }
    }

    function confirmDelivery(uint256 orderId) external {
        Order storage o = orders[orderId];
        Listing storage l = listings[o.listingId];
        if (o.id == 0) revert InvalidInput();
        if (l.seller == address(0)) revert InvalidInput();
        if (o.buyer != msg.sender) revert Unauthorized();
        if (o.status != OS.Pending) revert WrongStatus();
        o.status = OS.Fulfilled;
        core.distributeFee(l.token, o.fee);
        core.addPendingWithdrawal(l.seller, l.token, o.netAmount);
        emit Confirm(orderId, msg.sender);
    }

    function autoRelease(uint256 orderId) external {
        Order storage o = orders[orderId];
        Listing storage l = listings[o.listingId];
        if (o.id == 0) revert InvalidInput();
        if (l.seller == address(0)) revert InvalidInput();
        if (o.status != OS.Pending) revert WrongStatus();
        if (o.expiresAt > block.timestamp) revert InvalidInput();
        o.status = OS.Fulfilled;
        core.distributeFee(l.token, o.fee);
        core.addPendingWithdrawal(l.seller, l.token, o.netAmount);
        emit Confirm(orderId, l.seller);
    }

    function disputeOrder(uint256 orderId) external {
        Order storage o = orders[orderId];
        Listing storage l = listings[o.listingId];
        if (o.id == 0) revert InvalidInput();
        if (l.seller == address(0)) revert InvalidInput();
        if (o.buyer != msg.sender && l.seller != msg.sender) revert Unauthorized();
        if (o.status != OS.Pending) revert WrongStatus();
        o.status = OS.Disputed;
        emit Dispute(orderId, msg.sender);
    }

    function forceResolve(uint256 orderId, bool toSeller) external {
        if (msg.sender != core.owner() && !core.approvedModules(msg.sender)) revert Unauthorized();
        Order storage o = orders[orderId];
        if (o.id == 0) revert InvalidInput();
        if (o.status != OS.Disputed) revert WrongStatus();
        Listing storage l = listings[o.listingId];
        if (l.seller == address(0)) revert InvalidInput();
        if (toSeller) {
            o.status = OS.Resolved;
            core.distributeFee(l.token, o.fee);
            core.addPendingWithdrawal(l.seller, l.token, o.netAmount);
        } else {
            o.status = OS.Refunded;
            core.addPendingWithdrawal(o.buyer, l.token, o.amount);
        }
    }

    function _pull(address token, uint128 amount) private {
        if (token == address(0)) { if (msg.value != amount) revert InvalidInput(); }
        else { if (msg.value != 0) revert InvalidInput(); IERC20(token).safeTransferFrom(msg.sender, address(this), amount); }
    }

    function _fwd(address token, uint128 amount) private {
        if (token == address(0)) { (bool s,) = address(core).call{value: amount}(""); if (!s) revert InvalidInput(); }
        else { IERC20(token).safeTransfer(address(core), amount); }
    }

    receive() external payable {}
}
