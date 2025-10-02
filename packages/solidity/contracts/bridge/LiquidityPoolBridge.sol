// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityPoolBridge is Ownable {
    /// @notice The remote chain identifier
    address public remoteChain;
    /// @notice The ERC20 token representing the asset being bridged
    IERC20 public token;

    // Event for bridging intent
    event BridgeRequested(
        address indexed from,
        address indexed to,
        uint256 amount
    );

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
    function bridge(address to, uint256 amount) external {
        // Transfer the tokens from the sender to this contract
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        // Emit bridging intent
        emit BridgeRequested(msg.sender, to, amount);
    }
}
