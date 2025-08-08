// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./AddressStaking.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";

abstract contract AddressStakingV2 is AddressStaking, IGovernor {
    IGovernor[] __governors; // The governance branches that are allowed to govern the contract

    // ========== CONSTRUCTOR ==========

    constructor(
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingToken, // The token that is used for staking
        IGovernor[] memory _governors // The addresses that are allowed to govern the contract
    ) AddressStaking(_minWithdrawalBlocks, _stakingToken) {
        __governors = _governors;
    }

    // ========== PUBLIC ==========
    function votingDelay2() public view returns (uint256) {
        uint256 maxDelay = 0;
        for (uint256 i = 0; i < __governors.length; i++) {
            if (__governors[i].votingDelay() > maxDelay) {
                maxDelay = __governors[i].votingDelay();
            }
        }
        return maxDelay;
    }

    function votingPeriod2() public view returns (uint256) {
        uint256 maxPeriod = 0;
        for (uint256 i = 0; i < __governors.length; i++) {
            if (__governors[i].votingPeriod() > maxPeriod) {
                maxPeriod = __governors[i].votingPeriod();
            }
        }
        return maxPeriod + votingDelay2();
    }
}
