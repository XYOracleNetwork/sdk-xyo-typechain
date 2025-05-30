// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface ITransferStake {
    function stakingTokenAddress() external view returns (address);

    // Stake has been added to the contract
    event StakeIn(address indexed staker, uint256 amount);

    // Stake has been added to the contract
    event StakeOut(address indexed staker, uint256 amount);
}
