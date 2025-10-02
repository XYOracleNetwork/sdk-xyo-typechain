// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityPoolBridge is Ownable {
    /// @notice The identifier for the remote chain
    address public remoteChain;
    /// @notice The ERC20 token representing the asset being bridged
    IERC20 public token;

    /// @notice Emitted when a bridge to another chain is requested
    /// @param from The address initiating the bridge
    /// @param to The address receiving the bridged tokens
    /// @param amount The amount of tokens being bridged
    /// @param remoteChain The identifier for the remote chain
    event BridgeToRequested(
        address indexed from,
        address indexed to,
        uint256 amount,
        address indexed remoteChain
    );

    /// @notice Emitted when a bridge from another chain is completed
    /// @param from The address initiating the bridge
    /// @param to The address receiving the bridged tokens
    /// @param amount The amount of tokens being bridged
    /// @param remoteChain The identifier for the remote chain
    event BridgeFrom(
        address indexed from,
        address indexed to,
        uint256 amount,
        address indexed remoteChain
    );

    /// @notice Constructor for the LiquidityPoolBridge contract
    /// @param remoteChainIdentifier The identifier for the remote chain
    /// @param tokenAddress The address of the ERC20 representing the asset being bridged
    constructor(
        address remoteChainIdentifier,
        address tokenAddress
    ) Ownable(msg.sender) {
        remoteChain = remoteChainIdentifier;
        token = IERC20(tokenAddress);
    }

    /// @notice Request bridging tokens to another chain
    /// @param to The intended recipient on the destination chain
    /// @param amount The amount of tokens being bridged
    function bridgeTo(address to, uint256 amount) external {
        // Transfer the tokens from the sender to this contract
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        // Emit bridging intent
        emit BridgeToRequested(msg.sender, to, amount, remoteChain);
    }

    function bridgeFrom(
        address from,
        address to,
        uint256 amount
    ) external onlyOwner {
        // Transfer the tokens from this contract to the recipient
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient balance in bridge"
        );
        require(token.transfer(to, amount), "Transfer failed");
        emit BridgeFrom(from, to, amount, remoteChain);
    }
}
