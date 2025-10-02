// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityPoolBridge is Ownable {
    using SafeERC20 for IERC20;

    /// @notice The identifier for the remote chain
    address public immutable remoteChain;
    /// @notice The ERC20 token representing the asset being bridged
    IERC20 public immutable token;
    /// @notice The maximum amount that can be bridged in a single transaction
    uint256 public maxBridgeAmount;

    /// @notice Incrementing counter for unique bridge IDs
    uint256 public nextBridgeId;

    /// @notice Outbound bridge record
    struct BridgeOut {
        address from;
        address to;
        uint256 amount;
        uint256 timepoint;
    }

    /// @notice Inbound bridge record
    struct BridgeIn {
        address from;
        address to;
        uint256 amount;
        uint256 timepoint;
    }

    /// @notice History mappings
    mapping(uint256 => BridgeOut) public outboundBridges;
    mapping(uint256 => BridgeIn) public inboundBridges;

    /// @notice Emitted when a bridge to another chain is requested
    event BridgeTo(
        uint256 indexed id,
        address indexed from,
        address indexed to,
        uint256 amount,
        address remoteChain
    );

    /// @notice Emitted when a bridge from another chain is completed
    event BridgeFrom(
        uint256 indexed id,
        address indexed from,
        address indexed to,
        uint256 amount,
        address remoteChain
    );

    /// @notice Emitted when the maximum bridge amount is updated
    /// @param oldAmount The previous maximum bridge amount
    /// @param newAmount The new maximum bridge amount
    event MaxBridgeAmountUpdated(uint256 oldAmount, uint256 newAmount);

    /// @notice Constructor for the LiquidityPoolBridge contract
    /// @param remoteChainIdentifier The identifier for the remote chain
    /// @param tokenAddress The address of the ERC20 representing the asset being bridged
    constructor(
        address remoteChainIdentifier,
        address tokenAddress,
        uint256 maxBridgeAmount_
    ) Ownable(msg.sender) {
        require(remoteChainIdentifier != address(0), "remoteChain=0");
        require(tokenAddress != address(0), "token=0");
        require(maxBridgeAmount_ > 0, "max=0");

        remoteChain = remoteChainIdentifier;
        token = IERC20(tokenAddress);
        maxBridgeAmount = maxBridgeAmount_;
    }

    /// @notice Set a new maximum bridge amount
    /// @param newMax The new maximum bridge amount
    function setMaxBridgeAmount(uint256 newMax) external onlyOwner {
        require(newMax > 0, "max=0");
        uint256 old = maxBridgeAmount;
        maxBridgeAmount = newMax;
        emit MaxBridgeAmountUpdated(old, newMax);
    }

    /// @notice Request bridging tokens to another chain
    /// @param to The intended recipient on the destination chain
    /// @param amount The amount of tokens being bridged
    function bridgeTo(address to, uint256 amount) external {
        require(to != address(0), "to=0");
        require(amount > 0, "amount=0");
        require(amount <= maxBridgeAmount, "amount > max");

        token.safeTransferFrom(msg.sender, address(this), amount);

        uint256 id = nextBridgeId++;
        outboundBridges[id] = BridgeOut({
            from: msg.sender,
            to: to,
            amount: amount,
            timepoint: block.timestamp
        });

        emit BridgeTo(id, msg.sender, to, amount, remoteChain);
    }

    /// @notice Fulfill bridging tokens from the remoteChain
    /// @param from The address initiating the bridge
    /// @param to The address receiving the bridged tokens
    /// @param amount The amount of tokens being bridged
    function bridgeFrom(
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "to=0");
        require(amount > 0, "amount=0");
        require(token.balanceOf(address(this)) >= amount, "insufficient pool");

        token.safeTransfer(to, amount);

        uint256 id = nextBridgeId++;
        inboundBridges[id] = BridgeIn({
            from: from,
            to: to,
            amount: amount,
            timepoint: block.timestamp
        });

        emit BridgeFrom(id, from, to, amount, remoteChain);
    }
}
