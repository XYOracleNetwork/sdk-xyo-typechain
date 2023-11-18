// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../erc20/contracts/Erc20Store.sol";

interface IUniGenPair {
    /* Address of the source token */
    function source() external returns (IERC20);

    /* Address of the target token */
    function target() external returns (IERC20);

    /* Stake source tokens from caller's account */
    function stake(uint256 amount) external returns (uint256);

    /* Unstake some of the source tokens for caller's account */
    function unstake(uint256 amount) external returns (uint256);

    /* Unstake all the source tokens for caller's account */
    function unstakeAll() external returns (uint256);

    /* The amount of source token staked */
    function sourceBalance() external returns (uint256);

    /* The balance of target tokens */
    function targetBalance() external returns (uint256);

    /* The balance of target tokens for a specific address */
    function targetBalanceFor(address addr) external returns (uint256);

    // Deposit some of the realizable token [unrecoverable without stake]
    function deposit(uint256 amount) external returns (uint256);

    // Withdraw some of the realized target token
    function withdraw(uint256 amount) external returns (uint256);

    // Withdraw all of the realized token
    function withdrawAll() external returns (uint256);

    /* Realize the pending tokens for a specific account */
    function generate() external returns (uint256);

    /* Returns target tokens pending */
    function pending() external returns (uint256);

    /* Returns target tokens pending for a specific address*/
    function pendingFor(address addr) external returns (uint256);

    /* Returns target token availability - Total amount that can be generated */
    function available() external returns (uint256);
}
