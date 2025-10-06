// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILiquidityPoolBridge {
    /// @notice Thrown when bridged address is the zero address
    error BridgeAddressZero();
    /// @notice Thrown when bridged amount exceeds maximum allowed
    error BridgeAmountExceedsMax(uint256 amount, uint256 maxAllowed);
    /// @notice Thrown when bridged amount provided is zero
    error BridgeAmountZero();

    /// @notice Emitted when a bridge to another chain is requested
    event BridgedToRemote(
        uint256 indexed id,
        address indexed from,
        address indexed to,
        uint256 amount,
        address remoteChain
    );

    /// @notice Emitted when a bridge from another chain is completed
    event BridgedFromRemote(
        uint256 indexed id,
        address indexed srcAddress,
        address indexed destAddress,
        uint256 amount,
        address srcToken
    );

    /// @notice Emitted when the maximum bridge amount is updated
    event MaxBridgeAmountUpdated(uint256 oldAmount, uint256 newAmount);

    /// @notice The identifier for the remote chain
    function remoteChain() external view returns (address);

    /// @notice The ERC20 token representing the asset being bridged
    function token() external view returns (IERC20);

    /// @notice The maximum amount that can be bridged in a single transaction
    function maxBridgeAmount() external view returns (uint256);

    /// @notice Current outbound bridge counter
    function nextBridgeToId() external view returns (uint256);

    /// @notice Current inbound bridge counter
    function nextBridgeFromId() external view returns (uint256);

    /// @notice Set a new maximum bridge amount
    function setMaxBridgeAmount(uint256 newMax) external;

    /// @notice Request bridging tokens to the remoteChain
    /// @param to The intended recipient on the destination chain
    /// @param amount The amount of tokens being bridged
    function bridgeToRemote(address to, uint256 amount) external;

    /// @notice Fulfill bridging tokens from the remoteChain
    /// @param srcAddress The address initiating the bridge
    /// @param destAddress The address receiving the bridged tokens
    /// @param amount The amount of tokens being bridged
    function bridgeFromRemote(
        address srcAddress,
        address destAddress,
        uint256 amount
    ) external;
}
