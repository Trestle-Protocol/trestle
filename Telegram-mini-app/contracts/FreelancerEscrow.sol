// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMarketplaceCore.sol";

contract FreelancerEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error Unauthorized();
    error InvalidInput();
    error WrongStatus();
    error TransferFailed();

    IMarketplaceCore public immutable core;

    enum MS { Unfunded, Funded, Completed, Released, Disputed, Refunded }

    struct Svc {
        uint96  id;
        address freelancer;
        uint128 totalPrice;
        address token;
        bytes32 metaURI;
        uint8   milestoneCount;
        bool    active;
        uint40  createdAt;
    }

    struct MState {
        MS      status;
        address funder;
    }

    uint96  public serviceCounter;
    mapping(uint256 => Svc)      public services;
    mapping(uint256 => MState[]) public mstates;

    event Post(uint256 indexed id, address indexed freelancer, bytes32 metaURI, uint128 total);
    event Fund(uint256 indexed sid, uint256 indexed mid, address funder, uint128 amount);
    event Done(uint256 indexed sid, uint256 indexed mid);
    event Release(uint256 indexed sid, uint256 indexed mid, uint128 net);
    event Dispute(uint256 indexed sid, uint256 indexed mid);

    constructor(address _core) { core = IMarketplaceCore(_core); }

    function postService(bytes32 metaURI, uint128 total, address token, uint8 milestoneCount) external returns (uint256) {
        if (metaURI == bytes32(0) || total == 0 || milestoneCount == 0) revert InvalidInput();
        unchecked { ++serviceCounter; }
        uint96 id = serviceCounter;
        Svc storage s = services[id]; // use storage to save gas
        s.id = id; s.freelancer = msg.sender; s.totalPrice = total; s.token = token;
        s.metaURI = metaURI; s.milestoneCount = milestoneCount; s.active = true; s.createdAt = uint40(block.timestamp);
        emit Post(id, msg.sender, metaURI, total);
        return id;
    }

    function _initMStates(uint256 sid) private {
        if (mstates[sid].length != 0) return;
        uint8 n = services[sid].milestoneCount;
        MState[] storage ms = mstates[sid];
        unchecked {
            for (uint256 i; i < n; ++i) ms.push(MState(MS.Unfunded, address(0)));
        }
    }

    function _ms(uint256 sid, uint256 mid) private view returns (MState storage) {
        if (mid >= mstates[sid].length) revert InvalidInput();
        return mstates[sid][mid];
    }

    function fundMilestone(uint256 sid, uint256 mid) external payable nonReentrant {
        Svc storage s = services[sid];
        if (s.id == 0) revert InvalidInput();
        if (!s.active) revert InvalidInput();
        _initMStates(sid);
        MState storage ms = _ms(sid, mid);
        if (ms.status != MS.Unfunded) revert WrongStatus();
        if (msg.sender == s.freelancer) revert Unauthorized();
        unchecked {
            uint128 amt = uint128(s.totalPrice / s.milestoneCount);
            _pull(s.token, amt);
            _fwd(s.token, amt);
        }
        ms.status = MS.Funded;
        ms.funder = msg.sender;
        emit Fund(sid, mid, msg.sender, s.totalPrice / s.milestoneCount);
    }

    function completeMilestone(uint256 sid, uint256 mid) external {
        if (services[sid].id == 0) revert InvalidInput();
        if (services[sid].freelancer != msg.sender) revert Unauthorized();
        MState storage ms = _ms(sid, mid);
        if (ms.status != MS.Funded) revert WrongStatus();
        ms.status = MS.Completed;
        emit Done(sid, mid);
    }

    function releaseMilestone(uint256 sid, uint256 mid) external {
        MState storage ms = _ms(sid, mid);
        if (ms.status != MS.Completed) revert WrongStatus();
        if (ms.funder != msg.sender) revert Unauthorized();
        Svc storage s = services[sid];
        if (s.id == 0) revert InvalidInput();
        ms.status = MS.Released;
        unchecked {
            uint128 amt = uint128(s.totalPrice / s.milestoneCount);
            uint64 fee = uint64((uint256(amt) * core.FEE_BPS()) / core.BPS_DENOM());
            uint64 net = uint64(uint256(amt) - fee);
            core.distributeFee(s.token, fee);
            core.addPendingWithdrawal(s.freelancer, s.token, net);
            emit Release(sid, mid, net);
        }
    }

    function disputeMilestone(uint256 sid, uint256 mid) external {
        if (services[sid].id == 0) revert InvalidInput();
        MState storage ms = _ms(sid, mid);
        if (ms.status != MS.Funded && ms.status != MS.Completed) revert WrongStatus();
        if (msg.sender != ms.funder && msg.sender != services[sid].freelancer) revert Unauthorized();
        ms.status = MS.Disputed;
        emit Dispute(sid, mid);
    }

    function forceResolve(uint256 sid, uint256 mid, bool toFree) external {
        if (msg.sender != core.owner() && !core.approvedModules(msg.sender)) revert Unauthorized();
        if (services[sid].id == 0) revert InvalidInput();
        MState storage ms = _ms(sid, mid);
        if (ms.status != MS.Disputed) revert WrongStatus();
        Svc storage s = services[sid];
        unchecked {
            uint128 amt = uint128(s.totalPrice / s.milestoneCount);
            uint64 fee = uint64((uint256(amt) * core.FEE_BPS()) / core.BPS_DENOM());
            uint64 net = uint64(uint256(amt) - fee);
            if (toFree) {
                ms.status = MS.Released;
                core.distributeFee(s.token, fee);
                core.addPendingWithdrawal(s.freelancer, s.token, net);
            } else {
                ms.status = MS.Refunded;
                core.addPendingWithdrawal(ms.funder, s.token, amt);
            }
        }
    }

    function _pull(address token, uint128 amount) private {
        if (token == address(0)) { if (msg.value != amount) revert InvalidInput(); }
        else { if (msg.value != 0) revert InvalidInput(); IERC20(token).safeTransferFrom(msg.sender, address(this), amount); }
    }

    function _fwd(address token, uint128 amount) private {
        if (token == address(0)) { (bool s,) = address(core).call{value: amount}(""); if (!s) revert TransferFailed(); }
        else { IERC20(token).safeTransfer(address(core), amount); }
    }

    receive() external payable {}
}
