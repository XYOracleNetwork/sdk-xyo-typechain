// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./interface/IAddressStaking.sol";
import "../TransferStake/TransferStake.sol";
import "./AddressStakingProperties.sol";
import "./Library.sol";
import "./Internal.sol";

contract AddressStaking is
    IAddressStaking,
    TransferStake,
    AddressStakingProperties
{
    // ========== CONSTRUCTOR ==========

    constructor(
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingToken // The token that is used for staking
    )
        TransferStake(_stakingToken)
        AddressStakingProperties(_minWithdrawalBlocks)
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

    function getStake(
        address staker,
        uint256 slot
    ) public view returns (AddressStakingLibrary.Stake memory) {
        return _getStake(staker, slot);
    }
}
