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
        address _stakingToken // The token that is used for staking
    )
        TransferStake(_stakingToken)
        AddressStakingProperties(_minWithdrawalBlocks)
        Ownable(msg.sender)
    {}

    // ========== PUBLIC ==========

    function addStake(address staked, uint256 amount) public returns (bool) {
        return _addStake(staked, amount);
    }

    function removeStake(uint256 slot) public returns (bool) {
        return _removeStake(slot);
    }

    function withdrawStake(uint256 slot) public returns (bool) {
        return _withdrawStake(slot, this.minWithdrawalBlocks());
    }

    function slashStake(
        address stakedAddress,
        uint256 amount
    ) public onlyOwner returns (uint256) {
        return _slashStake(stakedAddress, amount);
    }

    function stakedAddresses(
        uint256 minStake
    ) external view returns (address[] memory) {
        return _stakedAddresses(minStake);
    }

    function getStake(
        address staker,
        uint256 slot
    ) public view returns (AddressStakingLibrary.Stake memory) {
        return _getStake(staker, slot);
    }
}
