// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {ILiquidityPoolBridge} from "./ILiquidityPoolBridge.sol";

contract LiquidityPoolBridge is ILiquidityPoolBridge, Ownable, Pausable {
    using SafeERC20 for IERC20;

    /// @notice The identifier for the remote chain
    address public immutable remoteChain;
    /// @notice The ERC20 token representing the asset being bridged
    IERC20 public immutable token;
    /// @notice The maximum amount that can be bridged in a single transaction
    uint256 public maxBridgeAmount;

    /// @notice Incrementing counter for unique inbound bridge IDs
    uint256 public nextBridgeFromId;
    /// @notice Incrementing counters for unique outbound bridge IDs
    uint256 public nextBridgeToId;

    /// @notice Constructor for the LiquidityPoolBridge contract
    /// @param remoteChain_ The identifier for the remote chain
    /// @param token_ The address of the ERC20 representing the asset being bridged
    /// @param maxBridgeAmount_ The maximum amount that can be bridged in a single transaction
    constructor(
        address remoteChain_,
        address token_,
        uint256 maxBridgeAmount_
    ) Ownable(msg.sender) {
        require(remoteChain_ != address(0), "remoteChain=0");
        require(token_ != address(0), "token=0");
        require(maxBridgeAmount_ > 0, "max=0");

        remoteChain = remoteChain_;
        token = IERC20(token_);
        maxBridgeAmount = maxBridgeAmount_;
    }

    /// @notice Set a new maximum bridge amount
    /// @param newMax The new maximum bridge amount
    function setMaxBridgeAmount(uint256 newMax) external onlyOwner {
        require(newMax > 0, "max=0");
        uint256 oldMax = maxBridgeAmount;
        maxBridgeAmount = newMax;
        emit MaxBridgeAmountUpdated(oldMax, newMax);
    }

    /// @notice Request bridging tokens to the remoteChain
    /// @param to The intended recipient on the destination chain
    /// @param amount The amount of tokens being bridged
    function bridgeToRemote(address to, uint256 amount) external whenNotPaused {
        if (to == address(0)) {
            revert BridgeAddressZero();
        }
        if (amount == 0) {
            revert BridgeAmountZero();
        }
        if (amount > maxBridgeAmount) {
            revert BridgeAmountExceedsMax(amount, maxBridgeAmount);
        }

        token.safeTransferFrom(msg.sender, address(this), amount);

        emit BridgedToRemote(
            nextBridgeToId++,
            msg.sender,
            to,
            amount,
            remoteChain
        );
    }

    /// @notice Fulfill bridging tokens from the remoteChain
    /// @param from The address initiating the bridge
    /// @param to The address receiving the bridged tokens
    /// @param amount The amount of tokens being bridged
    function bridgeFromRemote(
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) {
            revert BridgeAddressZero();
        }
        if (amount == 0) {
            revert BridgeAmountZero();
        }
        if (amount > maxBridgeAmount) {
            revert BridgeAmountExceedsMax(amount, maxBridgeAmount);
        }

        token.safeTransfer(to, amount);

        emit BridgedFromRemote(
            nextBridgeFromId++,
            from,
            to,
            amount,
            remoteChain
        );
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
