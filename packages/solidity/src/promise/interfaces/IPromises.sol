// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IPromises {
    function answer(
        uint256 id,
        uint256 answerHash,
        bytes[] calldata answer
    ) external;

    function cancel(uint256 id) external;

    function challenge(uint256 id, bytes[] calldata json) external;

    function stake(uint256 amount) external;

    /* Unstakes the address of the diviner */
    function unstake(uint256 amount) external;

    /* returns the maximum amount of stake that is ale to be unstaked */
    function maxUnstake(address diviner) external returns (uint256);
}
