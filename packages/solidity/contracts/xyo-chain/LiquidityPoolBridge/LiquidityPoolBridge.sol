// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {ILiquidityPoolBridge} from "./ILiquidityPoolBridge.sol";
import {Retirable} from "./Retirable.sol";

contract LiquidityPoolBridge is
    ILiquidityPoolBridge,
    Ownable,
    Pausable,
    Retirable
{
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
    /// @notice Source for the liquidity funds
    address public liquiditySource;

    /// @notice Struct to store bridge to remote event data
    struct BridgeToRemoteData {
        address srcAddress;
        address destAddress;
        uint256 amount;
        address destToken;
    }

    /// @notice Mapping of bridge IDs to bridging to remote event data
    mapping(uint256 => BridgeToRemoteData) public bridgesToRemote;

    struct BridgeFromRemoteData {
        address srcAddress;
        address destAddress;
        uint256 amount;
        address destToken;
    }

    /// @notice Mapping of bridge IDs to bridging from remote event data
    mapping(bytes32 => BridgeFromRemoteData) public bridgesFromRemote;

    /// @notice Constructor for the LiquidityPoolBridge contract
    /// @param remoteChain_ The identifier for the remote chain
    /// @param token_ The address of the ERC20 representing the asset being bridged
    /// @param maxBridgeAmount_ The maximum amount that can be bridged in a single transaction
    constructor(
        address remoteChain_,
        address token_,
        uint256 maxBridgeAmount_,
        address liquiditySource_
    ) Ownable(msg.sender) Retirable() {
        require(remoteChain_ != address(0), "remoteChain=0");
        require(token_ != address(0), "token=0");
        require(maxBridgeAmount_ > 0, "max=0");

        remoteChain = remoteChain_;
        token = IERC20(token_);
        maxBridgeAmount = maxBridgeAmount_;
        liquiditySource = liquiditySource_;
    }

    /// @notice Set a new maximum bridge amount
    /// @param newMax The new maximum bridge amount
    function setMaxBridgeAmount(
        uint256 newMax
    ) external whenNotRetired onlyOwner {
        require(newMax > 0, "max=0");
        uint256 oldMax = maxBridgeAmount;
        maxBridgeAmount = newMax;
        emit MaxBridgeAmountUpdated(oldMax, newMax);
    }

    /// @notice Request bridging tokens to the remoteChain
    /// @param destAddress The intended recipient on the destination chain
    /// @param amount The amount of tokens being bridged
    function bridgeToRemote(
        address destAddress,
        uint256 amount
    ) external whenNotRetired whenNotPaused {
        if (destAddress == address(0)) {
            revert BridgeAddressZero();
        }
        if (amount == 0) {
            revert BridgeAmountZero();
        }
        if (amount > maxBridgeAmount) {
            revert BridgeAmountExceedsMax(amount, maxBridgeAmount);
        }

        // Transfer tokens from sender to liquidity source
        token.safeTransferFrom(msg.sender, liquiditySource, amount);

        // Generate a new bridge ID
        uint256 nextId = nextBridgeToId++;

        // update mapping
        bridgesToRemote[nextId] = BridgeToRemoteData({
            srcAddress: msg.sender,
            destAddress: destAddress,
            amount: amount,
            destToken: address(token)
        });

        // emit event
        emit BridgedToRemote(
            nextId,
            msg.sender,
            destAddress,
            amount,
            remoteChain
        );
    }

    /// @notice Fulfill bridging tokens from the remoteChain
    /// @param srcAddress The address initiating the bridge
    /// @param destAddress The address receiving the bridged tokens
    /// @param amount The amount of tokens being bridged
    /// @param nonce The unique identifier for the bridge transaction
    function bridgeFromRemote(
        address srcAddress,
        address destAddress,
        uint256 amount,
        bytes32 nonce
    ) external whenNotRetired whenNotPaused onlyOwner {
        if (destAddress == address(0)) {
            revert BridgeAddressZero();
        }
        if (amount == 0) {
            revert BridgeAmountZero();
        }
        if (amount > maxBridgeAmount) {
            revert BridgeAmountExceedsMax(amount, maxBridgeAmount);
        }

        // Transfer tokens from liquidity source to destination
        token.safeTransferFrom(liquiditySource, destAddress, amount);

        // update mapping
        bridgesFromRemote[nonce] = BridgeFromRemoteData({
            srcAddress: srcAddress,
            destAddress: destAddress,
            amount: amount,
            destToken: address(token)
        });

        emit BridgedFromRemote(
            nextBridgeFromId++,
            srcAddress,
            destAddress,
            amount,
            remoteChain
        );
    }

    function pause() external whenNotRetired onlyOwner {
        _pause();
    }

    function unpause() external whenNotRetired onlyOwner {
        _unpause();
    }

    function _retire() internal override {
        // If not paused, pause the contract
        if (!paused()) _pause();
    }
}
