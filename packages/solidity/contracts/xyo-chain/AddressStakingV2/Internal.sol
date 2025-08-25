// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {AddressStakingLibrary} from "./Library.sol";
import {IAddressStakingEvents} from "./interfaces/IAddressStakingEvents.sol";
import {AbstractTransferStake} from "../TransferStake/Abstract.sol";
import {IAddressStakingProperties} from "./interfaces/IAddressStakingProperties.sol";

abstract contract AddressStakingInternal is
    IAddressStakingEvents,
    AbstractTransferStake
{
    uint256 internal _totalActiveStake;

    uint256 internal _totalPendingStake;

    uint256 internal _totalWithdrawnStake;

    uint256 internal _totalSlashedStake;

    //total amount that is actively staked for a given address
    mapping(address => uint256) internal _stakeAmountByAddressStaked;

    //total amount that is pending staked for a given address
    mapping(address => uint256) internal _pendingAmountByAddressStaked;

    //total amount that is staked by a given staker
    mapping(address => uint256) internal _stakeAmountByStaker;

    //all the stakes held by a given address
    mapping(address => AddressStakingLibrary.Stake[]) internal _accountStakes;

    //all the stakers for a given address
    mapping(address => address[]) internal _addressStakers;

    //all addresses that have StakeAdded
    address[] internal _addressesWithStake;

    function _addStake(address staked, uint256 amount) internal returns (bool) {
        require(amount > 0, "Staking: amount must be greater than 0");
        bool newStakeAddress = _stakeAmountByAddressStaked[staked] == 0;
        _transferStakeFromSender(amount);
        _accountStakes[msg.sender].push(
            AddressStakingLibrary.Stake({
                staked: staked,
                amount: amount,
                addBlock: block.number,
                removeBlock: 0,
                withdrawBlock: 0
            })
        );
        _totalActiveStake += amount;
        _stakeAmountByAddressStaked[staked] += amount;
        _stakeAmountByStaker[msg.sender] += amount;
        if (newStakeAddress) {
            _addressesWithStake.push(staked);
        }
        emit StakeAdded(
            staked,
            msg.sender,
            _accountStakes[msg.sender].length - 1,
            amount
        );
        return true;
    }

    function _removeStake(uint256 slot) internal returns (bool) {
        require(
            AddressStakingLibrary._isStakeRemovable(
                _accountStakes[msg.sender][slot]
            ),
            "Staking: not removable"
        );

        uint256 amount = _accountStakes[msg.sender][slot].amount;
        address staked = _accountStakes[msg.sender][slot].staked;

        _accountStakes[msg.sender][slot].removeBlock = block.number;
        _totalActiveStake -= amount;
        _totalPendingStake += amount;
        _stakeAmountByAddressStaked[staked] -= amount;
        _pendingAmountByAddressStaked[staked] += amount;
        _stakeAmountByStaker[msg.sender] -= amount;

        emit StakeRemoved(staked, msg.sender, slot, amount);
        return true;
    }

    function _withdrawStake(
        uint256 slot,
        uint256 minWithdrawalBlocks
    ) internal returns (bool) {
        require(
            AddressStakingLibrary._isStakeWithdrawable(
                _accountStakes[msg.sender][slot],
                minWithdrawalBlocks
            ),
            "Staking: not withdrawable"
        );

        uint256 amount = _accountStakes[msg.sender][slot].amount;
        address staked = _accountStakes[msg.sender][slot].staked;

        _accountStakes[msg.sender][slot].withdrawBlock = block.number;
        _pendingAmountByAddressStaked[staked] -= amount;
        _totalPendingStake -= amount;
        _totalWithdrawnStake += amount;

        _transferStakeToSender(amount);

        emit StakeWithdrawn(staked, msg.sender, slot, amount);

        return true;
    }

    function _slashStake(
        address stakedAddress,
        uint256 amount
    ) internal returns (uint256) {
        uint256 atRiskStake = _stakeAmountByAddressStaked[stakedAddress] +
            _pendingAmountByAddressStaked[stakedAddress];
        require(atRiskStake >= amount, "Staking: insufficient atRiskStake");
        uint256 slashRatio = (atRiskStake * 100000) / amount;
        uint256 totalSlashedAmountActive = 0;
        uint256 totalSlashedAmountPending = 0;
        for (uint256 i = 0; i < _accountStakes[stakedAddress].length; i++) {
            AddressStakingLibrary.Stake storage stake = _accountStakes[
                stakedAddress
            ][i];
            //skip already withdrawn stakes
            if (stake.withdrawBlock != 0) {
                continue;
            }
            uint256 slashedAmount = (stake.amount * slashRatio) / 100000;
            stake.amount -= slashedAmount;
            if (stake.removeBlock != 0) {
                _totalPendingStake -= slashedAmount;
                totalSlashedAmountPending += slashedAmount;
            } else {
                _totalActiveStake -= slashedAmount;
                totalSlashedAmountActive += slashedAmount;
            }
        }
        uint256 totalSlashedAmount = totalSlashedAmountPending +
            totalSlashedAmountActive;
        _totalSlashedStake += totalSlashedAmount;
        _burnStake(stakedAddress, totalSlashedAmount);

        _stakeAmountByAddressStaked[stakedAddress] -= totalSlashedAmountActive;

        _pendingAmountByAddressStaked[
            stakedAddress
        ] -= totalSlashedAmountPending;

        emit StakeSlashed(stakedAddress, totalSlashedAmount);
        return totalSlashedAmount;
    }

    function _getStake(
        address staker,
        uint256 slot
    ) internal view returns (AddressStakingLibrary.Stake memory) {
        return _accountStakes[staker][slot];
    }

    function _stakedAddresses(
        uint256 minStake
    ) internal view returns (address[] memory) {
        address[] memory result = new address[](
            _stakedAddressesCount(minStake)
        );
        uint256 index = 0;
        for (uint256 i = 0; i < _addressesWithStake.length; i++) {
            if (
                _stakeAmountByAddressStaked[_addressesWithStake[i]] >= minStake
            ) {
                result[index] = _addressesWithStake[i];
                index++;
            }
        }
        return result;
    }

    function _stakedAddressesCount(
        uint256 minStake
    ) internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _addressesWithStake.length; i++) {
            if (
                _stakeAmountByAddressStaked[_addressesWithStake[i]] >= minStake
            ) {
                count++;
            }
        }
        return count;
    }
}
