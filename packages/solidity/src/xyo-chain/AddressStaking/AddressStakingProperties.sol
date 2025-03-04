// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./interface/IAddressStakingProperties.sol";
import "./Internal.sol";

abstract contract AddressStakingProperties is
    IAddressStakingProperties,
    AddressStakingInternal
{
    uint256 private __minWithdrawalBlocks;

    constructor(
        uint256 _minWithdrawalBlocks // The minimum number of blocks that must pass before a pending stake can be withdrawn
    ) {
        __minWithdrawalBlocks = _minWithdrawalBlocks;
    }

    function minWithdrawalBlocks() external view returns (uint256) {
        return __minWithdrawalBlocks;
    }

    function activeByAddressStaked(
        address staked
    ) external view returns (uint256) {
        return _stakeAmountByAddressStaked[staked];
    }

    function activeByStaker(address staker) external view returns (uint256) {
        return AddressStakingLibrary._calcActiveStake(_accountStakes[staker]);
    }

    function pendingByStaker(address staker) external view returns (uint256) {
        return AddressStakingLibrary._calcPendingStake(_accountStakes[staker]);
    }

    function withdrawnByStaker(address staker) external view returns (uint256) {
        return
            AddressStakingLibrary._calcWithdrawnStake(_accountStakes[staker]);
    }

    function active() external view returns (uint256) {
        return _totalActiveStake;
    }

    function pending() external view returns (uint256) {
        return _totalPendingStake;
    }

    function withdrawn() external view returns (uint256) {
        return _totalWithdrawnStake;
    }
}
