// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IBurnable.sol";

contract BurnableErc20 is IBurnable, ERC20 {
    using SafeERC20 for ERC20;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    function burn(uint256 amount) public override {
        _burn(msg.sender, amount);
    }
}
