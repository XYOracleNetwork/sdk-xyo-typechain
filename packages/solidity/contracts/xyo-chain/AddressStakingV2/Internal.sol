// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {AddressStakingLibrary} from "./Library.sol";
import {IAddressStakingEvents} from "./interfaces/IAddressStakingEvents.sol";
import {AbstractTransferStake} from "../TransferStakeV2/Abstract.sol";
import {IAddressStakingProperties} from "./interfaces/IAddressStakingProperties.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract AddressStakingInternal is
    IAddressStakingEvents,
    AbstractTransferStake
{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    uint256 internal _maxStakersPerAddress;
    address internal _unlimitedStakerAddress;

    // the minimum stake that is required for an address to vote
    uint256 internal _minStake;

    EnumerableSet.AddressSet internal _addressesWithMinStake;

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
    mapping(address => EnumerableSet.UintSet) internal _stakerStakes;

    //all the stake ids for a given staked address
    mapping(address => EnumerableSet.UintSet) internal _addressStakes;

    //all addresses that have been staked
    address[] internal _stakedAddresses;

    function _getLowestStakeSlot(
        address staked
    ) internal view returns (uint256) {
        uint256 lowestAmount = type(uint256).max;
        uint256 lowestIndex = type(uint256).max;
        for (uint256 i = 0; i < _addressStakes[staked].length(); i++) {
            uint256 id = _addressStakes[staked].at(i);
            AddressStakingLibrary.Stake memory stake = _allStakes[id];
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

    function _removeWithdrawableStakes(
        EnumerableSet.UintSet storage idSet,
        uint256 minWithdrawalBlocks
    ) internal {
        uint256[] memory ids = idSet.values();
        for (uint256 i = 0; i < ids.length; i++) {
            AddressStakingLibrary.Stake memory stake = _getStakeById(ids[i]);
            //remove if withdrawable or already withdrawn
            if (
                AddressStakingLibrary._isStakeWithdrawable(
                    stake,
                    minWithdrawalBlocks
                ) || stake.withdrawBlock != 0
            ) {
                idSet.remove(stake.id);
            }
        }
    }

    function _addStake(
        address staked,
        uint256 amount,
        uint256 minWithdrawalBlocks
    ) internal returns (bool) {
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
        _stakerStakes[msg.sender].add(stake.id);

        //make space for new stake if needed
        if (
            _addressStakes[staked].length() >= _maxStakersPerAddress &&
            _unlimitedStakerAddress != staked
        ) {
            //remove non-at-risk stakes - we do this to prevent a withdrawable stake from being kept over an at-risk stake
            _removeWithdrawableStakes(
                _addressStakes[staked],
                minWithdrawalBlocks
            );

            //check again in case we are now under the max
            if (_addressStakes[staked].length() >= _maxStakersPerAddress) {
                uint256 lowestSlot = _getLowestStakeSlot(staked);
                uint256 lowestId = _addressStakes[staked].at(lowestSlot);
                AddressStakingLibrary.Stake memory lowestStake = _allStakes[
                    lowestId
                ];

                //check if new stake is higher than the lowest stake
                require(lowestStake.amount < amount, "Stake amount too low");

                _removeStake(lowestId);
                _withdrawStake(lowestId, 0);
                _addressStakes[staked].remove(lowestId);
            }
        }

        _addressStakes[staked].add(stake.id);
        _totalActiveStake += amount;
        _stakeAmountByAddressStaked[staked] += amount;
        _stakeAmountByStaker[msg.sender] += amount;
        if (newStakeAddress) {
            _stakedAddresses.push(staked);
        }
        if (
            !_addressesWithMinStake.contains(staked) &&
            _stakeAmountByAddressStaked[staked] >= _minStake
        ) {
            _addressesWithMinStake.add(staked);
        }
        emit StakeAdded(staked, msg.sender, stake.id, amount);
        return true;
    }

    function _removeStake(uint256 id) internal returns (bool) {
        AddressStakingLibrary.Stake storage stake = _allStakes[id];

        require(stake.id == id, "Staking: invalid id");

        uint256 amount = stake.amount;
        address staked = stake.staked;

        stake.removeBlock = block.number;
        _totalActiveStake -= amount;
        _totalPendingStake += amount;
        _stakeAmountByAddressStaked[staked] -= amount;
        _pendingAmountByAddressStaked[staked] += amount;
        _stakeAmountByStaker[stake.staker] -= amount;

        if (
            _addressesWithMinStake.contains(staked) &&
            _stakeAmountByAddressStaked[staked] < _minStake
        ) {
            _addressesWithMinStake.remove(staked);
        }

        emit StakeRemoved(staked, stake.staker, id, amount);
        return true;
    }

    function _withdrawStake(
        uint256 id,
        uint256 minWithdrawalBlocks
    ) internal returns (bool) {
        AddressStakingLibrary.Stake storage stake = _allStakes[id];

        require(stake.id == id, "Staking: invalid id");

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

        _transferStakeToStaker(stake.staker, amount);

        emit StakeWithdrawn(staked, stake.staker, id, amount);

        return true;
    }

    function _stakesFromIds(
        uint256[] memory ids
    ) internal view returns (AddressStakingLibrary.Stake[] memory) {
        AddressStakingLibrary.Stake[]
            memory stakes = new AddressStakingLibrary.Stake[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            stakes[i] = _allStakes[ids[i]];
        }
        return stakes;
    }

    function _slashStake(
        address stakedAddress,
        uint256 amount,
        uint256 minWithdrawalBlocks
    ) internal returns (uint256) {
        //remove non-at-risk stakes - we do this to prevent a withdrawable stake from being kept over an at-risk stake
        _removeWithdrawableStakes(
            _addressStakes[stakedAddress],
            minWithdrawalBlocks
        );

        uint256[] memory stakeIds = _addressStakes[stakedAddress].values();

        require(stakeIds.length > 0, "Staking: no stakes to slash");

        uint256 atRiskStake = _stakeAmountByAddressStaked[stakedAddress] +
            _pendingAmountByAddressStaked[stakedAddress];

        //if the address is under-staked, then take all the stake
        if (atRiskStake < amount) {
            amount = atRiskStake;
        }

        uint256 slashRatio = (amount * 100000) / atRiskStake;
        uint256 totalSlashedAmountActive = 0;
        uint256 totalSlashedAmountPending = 0;
        for (uint256 i = 0; i < stakeIds.length; i++) {
            AddressStakingLibrary.Stake storage stake = _allStakes[stakeIds[i]];
            uint256 slashedAmount = (stake.amount * slashRatio) / 100000;
            stake.amount -= slashedAmount;

            // reduce counters
            if (stake.removeBlock == 0) {
                //_stakeAmountByStaker is only active stake, so only reduce it if not yet removed
                _stakeAmountByStaker[stake.staker] -= slashedAmount;
            }

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
        return _allStakes[_stakerStakes[staker].at(slot)];
    }

    function _getStakeById(
        uint256 id
    ) internal view returns (AddressStakingLibrary.Stake memory) {
        return _allStakes[id];
    }

    function _getStakerStakes(
        address staker
    ) internal view returns (AddressStakingLibrary.Stake[] memory) {
        return _stakesFromIds(_stakerStakes[staker].values());
    }

    function _stakedAddressesWithMinStake()
        internal
        view
        returns (address[] memory)
    {
        return _addressesWithMinStake.values();
    }

    function _stakedAddressesWithMinStakeCount()
        internal
        view
        returns (uint256)
    {
        return _addressesWithMinStake.length();
    }

    function _getStakeCountForAddress(
        address account
    ) internal view returns (uint256) {
        return _addressStakes[account].length();
    }

    function _getAccountStakeBySlot(
        address account,
        uint256 slot
    ) internal view returns (uint256) {
        return _allStakes[_addressStakes[account].at(slot)].amount;
    }
}
