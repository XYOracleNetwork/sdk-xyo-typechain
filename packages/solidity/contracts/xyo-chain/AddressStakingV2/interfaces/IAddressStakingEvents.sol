// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IAddressStakingEvents {
    // This is when a stake is added to the staking contract
    event StakeAdded(
        address indexed staked,
        address indexed by,
        uint256 indexed slot,
        uint256 amount
    );

    // This is when a specific stake is requested for removal.  It removes it from the staked amount but does not actually remove the XYO from the staking contract
    event StakeRemoved(
        address indexed staked,
        address indexed by,
        uint256 indexed slot,
        uint256 amount
    );

    // This is when actual XYO is removed from the staking contract
    event StakeWithdrawn(
        address indexed staked,
        address indexed by,
        uint256 indexed slot,
        uint256 amount
    );

    event StakeSlashed(address indexed staked, uint256 amount);
}
