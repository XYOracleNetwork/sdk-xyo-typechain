// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "./AddressStaking.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

abstract contract AddressStakingV2 is
    Governor,
    AddressStaking,
    GovernorCountingSimple
{
    IGovernor[] __governors; // The governance branches that are allowed to govern the contract
    mapping(IGovernor => bool) public isGovernor;

    // ========== CONSTRUCTOR ==========

    constructor(
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingToken, // The token that is used for staking
        IGovernor[] memory _governors // The addresses that are allowed to govern the contract
    ) AddressStaking(_minWithdrawalBlocks, _stakingToken) {
        __governors = _governors;
        for (uint256 i = 0; i < _governors.length; i++) {
            isGovernor[__governors[i]] = true;
        }
    }

    // ========== PUBLIC ==========

    /**
     * @dev Returns the governors that have approval authority
     */
    function governors() public view returns (IGovernor[] memory) {
        return __governors;
    }

    function getVotes(
        address account,
        uint256 /* blockNumber */
    ) public view override returns (uint256) {
        return isGovernor[IGovernor(account)] ? 1 : 0;
    }

    function votingDelay() public view override returns (uint256) {
        uint256 maxDelay = 0;
        for (uint256 i = 0; i < __governors.length; i++) {
            if (__governors[i].votingDelay() > maxDelay) {
                maxDelay = __governors[i].votingDelay();
            }
        }
        return maxDelay;
    }

    function votingPeriod() public view override returns (uint256) {
        uint256 maxPeriod = 0;
        for (uint256 i = 0; i < __governors.length; i++) {
            if (__governors[i].votingPeriod() > maxPeriod) {
                maxPeriod = __governors[i].votingPeriod();
            }
        }
        return maxPeriod;
    }

    function quorum(
        uint256 /* blockNumber */
    ) public view override returns (uint256) {
        return __governors.length;
    }
}
