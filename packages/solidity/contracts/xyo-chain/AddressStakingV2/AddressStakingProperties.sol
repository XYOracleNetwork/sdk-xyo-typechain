// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {IAddressStakingProperties} from "./interfaces/IAddressStakingProperties.sol";
import {AddressStakingInternal} from "./Internal.sol";
import {AddressStakingLibrary} from "./Library.sol";

abstract contract AddressStakingProperties is
    IAddressStakingProperties,
    AddressStakingInternal
{
    uint256 internal __minWithdrawalBlocks;

    constructor(
        uint256 _minWithdrawalBlocks // The minimum number of blocks that must pass before a pending stake can be withdrawn
    ) {
        require(
            _minWithdrawalBlocks > 0,
            "Staking: invalid minWithdrawalBlocks"
        );
        __minWithdrawalBlocks = _minWithdrawalBlocks;
    }

    function minWithdrawalBlocks() external view returns (uint256) {
        return __minWithdrawalBlocks;
    }

    function activeByAddressStaked(
        address staked
    ) external view returns (uint256) {
        return _activeAmountByAddressStaked[staked];
    }

    function activeByStaker(address staker) external view returns (uint256) {
        return AddressStakingLibrary._calcActiveStake(_getStakerStakes(staker));
    }

    function pendingByStaker(address staker) external view returns (uint256) {
        return
            AddressStakingLibrary._calcPendingStake(_getStakerStakes(staker));
    }

    function withdrawnByStaker(address staker) external view returns (uint256) {
        return
            AddressStakingLibrary._calcWithdrawnStake(_getStakerStakes(staker));
    }

    function active() external view returns (uint256) {
        return _totalActiveStake;
    }

    function minStake() external view returns (uint256) {
        return _minStake;
    }

    function pending() external view returns (uint256) {
        return _totalPendingStake;
    }

    function slashed() external view returns (uint256) {
        return _totalSlashedStake;
    }

    function withdrawn() external view returns (uint256) {
        return _totalWithdrawnStake;
    }
}
