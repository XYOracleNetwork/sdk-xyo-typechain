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
    uint256 internal _maxStakersPerAddress;
    address internal _unlimitedStakerAddress;

    /**** Global staking totals ****/
    uint256 internal _totalActiveStake;

    uint256 internal _totalPendingStake;

    uint256 internal _totalWithdrawnStake;

    uint256 internal _totalSlashedStake;

    /**** Address relative staking totals ****/
    //total amount that is actively staked for a given address
    mapping(address => uint256) internal _stakeAmountByAddressStaked;

    //total amount that is pending staked for a given address
    mapping(address => uint256) internal _pendingAmountByAddressStaked;

    //total amount that is staked by a given staker
    mapping(address => uint256) internal _stakeAmountByStaker;

    /**** Stake Mappings ****/

    AddressStakingLibrary.Stake[] internal _allStakes;

    //all the stake ids held by a given staker
    mapping(address => uint256[]) internal _stakerStakes;

    //all the stake ids for a given staked address
    mapping(address => uint256[]) internal _addressStakes;

    //all addresses that have been staked
    address[] internal _stakedAddresses;

    function _getLowestStakeSlot(
        address staked
    ) internal view returns (uint256) {
        uint256 lowestAmount = type(uint256).max;
        uint256 lowestIndex = type(uint256).max;
        for (uint256 i = 0; i < _addressStakes[staked].length; i++) {
            AddressStakingLibrary.Stake memory stake = _allStakes[
                _addressStakes[staked][i]
            ];
            if (stake.amount < lowestAmount) {
                lowestAmount = stake.amount;
                lowestIndex = i;
            }
        }
        require(
            lowestIndex != type(uint256).max,
            "Staking: no active stakes found"
        );
        return lowestIndex;
    }

    function _addStake(address staked, uint256 amount) internal returns (bool) {
        require(amount > 0, "Staking: amount must be greater than 0");
        bool newStakeAddress = _stakeAmountByAddressStaked[staked] == 0;
        _transferStakeFromSender(amount);

        AddressStakingLibrary.Stake memory stake = AddressStakingLibrary.Stake({
            id: _allStakes.length,
            staker: msg.sender,
            staked: staked,
            amount: amount,
            addBlock: block.number,
            removeBlock: 0,
            withdrawBlock: 0
        });

        _allStakes.push(stake);
        _stakerStakes[msg.sender].push(stake.id);
        if (
            _addressStakes[staked].length < _maxStakersPerAddress ||
            _unlimitedStakerAddress == staked
        ) {
            //add the stake id
            _addressStakes[staked].push(stake.id);
        } else {
            //replace the stake id after removing/withdrawing lowest stake
            uint256 lowestSlot = _getLowestStakeSlot(staked);
            _removeStake(_addressStakes[staked][lowestSlot]);
            _withdrawStake(_addressStakes[staked][lowestSlot], 0);
            _addressStakes[staked][lowestSlot] = stake.id;
        }
        _totalActiveStake += amount;
        _stakeAmountByAddressStaked[staked] += amount;
        _stakeAmountByStaker[msg.sender] += amount;
        if (newStakeAddress) {
            _stakedAddresses.push(staked);
        }
        emit StakeAdded(staked, msg.sender, stake.id, amount);
        return true;
    }

    function _slotFromId(
        address account,
        uint256 id
    ) internal view returns (uint256) {
        for (uint256 i = 0; i < _stakerStakes[account].length; i++) {
            if (_stakerStakes[account][i] == id) {
                return i;
            }
        }
        revert("Staking: invalid id");
    }

    function _removeStake(uint256 id) internal returns (bool) {
        AddressStakingLibrary.Stake storage stake = _allStakes[id];

        require(stake.id == id, "Staking: invalid id");
        require(stake.staker == msg.sender, "Staking: invalid staker");

        require(
            AddressStakingLibrary._isStakeRemovable(stake),
            "Staking: not removable"
        );

        uint256 amount = stake.amount;
        address staked = stake.staked;

        stake.removeBlock = block.number;
        _totalActiveStake -= amount;
        _totalPendingStake += amount;
        _stakeAmountByAddressStaked[staked] -= amount;
        _pendingAmountByAddressStaked[staked] += amount;
        _stakeAmountByStaker[msg.sender] -= amount;

        emit StakeRemoved(staked, msg.sender, id, amount);
        return true;
    }

    function _withdrawStake(
        uint256 id,
        uint256 minWithdrawalBlocks
    ) internal returns (bool) {
        AddressStakingLibrary.Stake storage stake = _allStakes[id];

        require(stake.id == id, "Staking: invalid id");
        require(stake.staker == msg.sender, "Staking: invalid staker");

        require(
            AddressStakingLibrary._isStakeWithdrawable(
                stake,
                minWithdrawalBlocks
            ),
            "Staking: not withdrawable"
        );

        uint256 amount = stake.amount;
        address staked = stake.staked;

        stake.withdrawBlock = block.number;
        _pendingAmountByAddressStaked[staked] -= amount;
        _totalPendingStake -= amount;
        _totalWithdrawnStake += amount;

        _transferStakeToSender(amount);

        emit StakeWithdrawn(staked, msg.sender, id, amount);

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
        for (uint256 i = 0; i < _stakerStakes[stakedAddress].length; i++) {
            uint256 id = _stakerStakes[stakedAddress][i];
            AddressStakingLibrary.Stake storage stake = _allStakes[id];
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
        return _allStakes[_stakerStakes[staker][slot]];
    }

    function _getStakerStakes(
        address staker
    ) internal view returns (AddressStakingLibrary.Stake[] memory) {
        AddressStakingLibrary.Stake[]
            memory stakes = new AddressStakingLibrary.Stake[](
                _stakerStakes[staker].length
            );
        for (uint256 i = 0; i < _stakerStakes[staker].length; i++) {
            stakes[i] = _allStakes[_stakerStakes[staker][i]];
        }
        return stakes;
    }

    function _stakedAddressesWithMinStake(
        uint256 minStake
    ) internal view returns (address[] memory) {
        address[] memory result = new address[](
            _stakedAddressesCount(minStake)
        );
        uint256 index = 0;
        for (uint256 i = 0; i < _stakedAddresses.length; i++) {
            if (_stakeAmountByAddressStaked[_stakedAddresses[i]] >= minStake) {
                result[index] = _stakedAddresses[i];
                index++;
            }
        }
        return result;
    }

    function _stakedAddressesCount(
        uint256 minStake
    ) internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _stakedAddresses.length; i++) {
            if (_stakeAmountByAddressStaked[_stakedAddresses[i]] >= minStake) {
                count++;
            }
        }
        return count;
    }
}
