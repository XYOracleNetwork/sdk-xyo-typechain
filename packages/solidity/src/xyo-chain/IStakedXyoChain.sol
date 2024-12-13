// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IStakedXyoChain {
    function currentStake(address by) external view returns (uint256);

    function addStake(address staked, uint256 amount) external returns (bool);

    function removeStake(uint256 slot) external returns (bool);

    function withdrawStake(uint256 slot) external returns (bool);

    function calcActiveStake(address by) external view returns (uint256);

    function calcPendingStake(address by) external view returns (uint256);

    function calcWithdrawnStake(address by) external view returns (uint256);

    // This is when a stake is added to the staking contract
    event StakeAdded(address indexed by, uint256 indexed slot, uint256 amount);

    // This is when a specific stake is requested for removal.  It removes it from the staked amount but does not actually remove the XYO from the staking contract
    event StakeRemoved(
        address indexed by,
        uint256 indexed slot,
        uint256 amount
    );

    // This is when actual XYO is removed from the staking contract
    event StakeWithdrawn(
        address indexed by,
        uint256 indexed slot,
        uint256 amount
    );
}
