// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../IBurnable.sol";

interface IBurnableErc20 is IERC20, IBurnable {}
