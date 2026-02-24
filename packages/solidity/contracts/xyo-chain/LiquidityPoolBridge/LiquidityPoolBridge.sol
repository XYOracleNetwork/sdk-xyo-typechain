// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {ILiquidityPoolBridge} from "./ILiquidityPoolBridge.sol";
import {Retirable} from "./Retirable.sol";

contract LiquidityPoolBridge is
    ILiquidityPoolBridge,
    Ownable,
    Pausable,
    Retirable
{
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

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

    /// @notice Enumerable set of bridge IDs for outbound bridges (to remote)
    EnumerableSet.UintSet private bridgeToIds;

    /// @notice Mapping of bridge IDs to bridging to remote event data
    mapping(uint256 => BridgeToRemoteData) public bridgesToRemote;

    /// @notice Struct to store bridge from remote event data
    struct BridgeFromRemoteData {
        address srcAddress;
        address destAddress;
        uint256 amount;
        address destToken;
    }

    /// @notice Enumerable set of bridge nonces for inbound bridges (from remote)
    EnumerableSet.UintSet private bridgeFromNonces;

    /// @notice Mapping of bridge IDs to bridging from remote event data
    mapping(uint256 => BridgeFromRemoteData) public bridgesFromRemote;

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

        // Generate a new bridge ID
        nextBridgeToId++;

        // Check if bridge ID already exists
        if (bridgesToRemote[nextBridgeToId].srcAddress != address(0)) {
            revert BridgesToRemoteAlreadyExists(nextBridgeToId);
        }

        // Transfer tokens from sender to liquidity source
        token.safeTransferFrom(msg.sender, liquiditySource, amount);

        // update mapping + add to enumerable set
        bridgesToRemote[nextBridgeToId] = BridgeToRemoteData({
            srcAddress: msg.sender,
            destAddress: destAddress,
            amount: amount,
            destToken: address(token)
        });
        bridgeToIds.add(nextBridgeToId);

        // emit event
        emit BridgedToRemote(
            nextBridgeToId,
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
    /// @param nonce The unique identifier for the bridge transaction (i.e. transaction hash from remote chain)
    function bridgeFromRemote(
        address srcAddress,
        address destAddress,
        uint256 amount,
        uint256 nonce
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
        // Check if nonce already exists
        if (bridgesFromRemote[nonce].srcAddress != address(0)) {
            revert BridgesFromRemoteAlreadyExists(nonce);
        }

        // Increment bridge from remote counter
        nextBridgeFromId++;

        // Transfer tokens from liquidity source to destination
        token.safeTransferFrom(liquiditySource, destAddress, amount);

        // update mapping + add to enumerable set
        bridgesFromRemote[nonce] = BridgeFromRemoteData({
            srcAddress: srcAddress,
            destAddress: destAddress,
            amount: amount,
            destToken: address(token)
        });
        bridgeFromNonces.add(nonce);

        // emit event
        emit BridgedFromRemote(
            nonce,
            srcAddress,
            destAddress,
            amount,
            remoteChain
        );
    }

    // ----------------------------
    // Enumeration helpers (view)
    // ----------------------------

    /// @notice Number of outbound bridges (to remote) recorded
    function bridgesToRemoteCount() external view returns (uint256) {
        return bridgeToIds.length();
    }

    /// @notice Get outbound bridge id by index (0..count-1)
    function bridgesToRemoteIdAt(
        uint256 index
    ) external view returns (uint256) {
        return bridgeToIds.at(index);
    }

    /// @notice Page through outbound bridge ids
    /// @dev Returns up to `limit` ids starting at `offset`
    function bridgesToRemoteIds(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory ids) {
        uint256 len = bridgeToIds.length();
        if (offset >= len) return new uint256[](0);
        uint256 end = offset + limit;
        if (end > len) end = len;

        ids = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            ids[i - offset] = bridgeToIds.at(i);
        }
    }

    /// @notice Number of inbound bridges (from remote) recorded
    function bridgesFromRemoteCount() external view returns (uint256) {
        return bridgeFromNonces.length();
    }

    /// @notice Get inbound bridge nonce by index (0..count-1)
    function bridgesFromRemoteNonceAt(
        uint256 index
    ) external view returns (uint256) {
        return bridgeFromNonces.at(index);
    }

    /// @notice Page through inbound bridge nonces
    /// @dev Returns up to `limit` nonces starting at `offset`
    function bridgesFromRemoteNonces(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory nonces) {
        uint256 len = bridgeFromNonces.length();
        if (offset >= len) return new uint256[](0);
        uint256 end = offset + limit;
        if (end > len) end = len;

        nonces = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            nonces[i - offset] = bridgeFromNonces.at(i);
        }
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
