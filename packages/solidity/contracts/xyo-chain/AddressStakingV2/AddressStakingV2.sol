// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {IAddressStaking} from "./interfaces/IAddressStaking.sol";
import {TransferStake} from "../TransferStake/TransferStake.sol";
import {AddressStakingProperties} from "./AddressStakingProperties.sol";
import {AddressStakingLibrary} from "./Library.sol";
import {AddressStakingInternal} from "./Internal.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AddressStakingV2 is
    IAddressStaking,
    TransferStake,
    AddressStakingProperties,
    Ownable
{
    // ========== CONSTRUCTOR ==========

    constructor(
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingToken, // The token that is used for staking
        uint256 maxStakersPerAddress_,
        address unlimitedStakerAddress_,
        uint256 minStake_
    )
        TransferStake(_stakingToken)
        AddressStakingProperties(_minWithdrawalBlocks)
        Ownable(msg.sender)
    {
        _unlimitedStakerAddress = unlimitedStakerAddress_;
        _maxStakersPerAddress = maxStakersPerAddress_;
        _minStake = minStake_;
    }

    // ========== PUBLIC ==========

    function addStake(address staked, uint256 amount) public returns (bool) {
        return _addStake(staked, amount);
    }

    function removeStake(uint256 id) public returns (bool) {
        AddressStakingLibrary.Stake memory stake = _getStakeById(id);
        require(
            stake.staker == msg.sender,
            "Staking: stake not owned by caller"
        );
        require(
            AddressStakingLibrary._isStakeRemovable(stake),
            "Staking: not removable"
        );
        return _removeStake(id);
    }

    function withdrawStake(uint256 id) public returns (bool) {
        require(
            _getStakeById(id).staker == msg.sender,
            "Staking: stake not owned by caller"
        );
        return _withdrawStake(id, this.minWithdrawalBlocks());
    }

    function slashStake(
        address stakedAddress,
        uint256 amount
    ) public onlyOwner returns (uint256) {
        return _slashStake(stakedAddress, amount);
    }

    function stakedAddressesWithMinStake()
        external
        view
        returns (address[] memory)
    {
        return _stakedAddressesWithMinStake();
    }

    function stakedAddressesWithMinStakeCount()
        external
        view
        returns (uint256)
    {
        return _stakedAddressesWithMinStakeCount();
    }

    function getStake(
        address staker,
        uint256 slot
    ) public view returns (AddressStakingLibrary.Stake memory) {
        return _getStake(staker, slot);
    }

    function getStakeById(
        uint256 id
    ) public view returns (AddressStakingLibrary.Stake memory) {
        return _getStakeById(id);
    }
}
