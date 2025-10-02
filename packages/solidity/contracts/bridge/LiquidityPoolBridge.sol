// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityPoolBridge is Ownable {
    IERC20 public token;

    constructor(address tokenAddress) Ownable(msg.sender) {
        token = IERC20(tokenAddress);
    }

    // The bridge function takes the recipient address and the amount, and the sender is inferred as msg.sender
    function bridge(address to, uint256 amount) external {
        // Transfer the tokens from the sender to this contract
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // TODO: Emit event
    }
}
