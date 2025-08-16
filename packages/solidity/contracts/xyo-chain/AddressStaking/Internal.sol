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

    //total amount that is staked for a given address
    mapping(address => uint256) internal _stakeAmountByAddressStaked;

    //total amount that is staked by a given staker
    mapping(address => uint256) internal _stakeAmountByStaker;

    //all the stakes held by a given address
    mapping(address => AddressStakingLibrary.Stake[]) internal _accountStakes;

    //all the stakers for a given address
    mapping(address => address[]) internal _addressStakers;

    function _addStake(address staked, uint256 amount) internal returns (bool) {
        require(amount > 0, "Staking: amount must be greater than 0");
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
        _totalPendingStake -= amount;
        _totalWithdrawnStake += amount;

        _transferStakeToSender(amount);

        emit StakeWithdrawn(staked, msg.sender, slot, amount);

        return true;
    }

    function _getStake(
        address staker,
        uint256 slot
    ) internal view returns (AddressStakingLibrary.Stake memory) {
        return _accountStakes[staker][slot];
    }
}
