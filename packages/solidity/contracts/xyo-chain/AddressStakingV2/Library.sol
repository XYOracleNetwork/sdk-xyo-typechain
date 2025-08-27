// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

library AddressStakingLibrary {
    struct Stake {
        // the unique id for the stake item
        uint256 id;
        // the address that owns the stake
        address staker;
        // the address that is being staked
        address staked;
        // the amount that is staked
        uint256 amount;
        // the block number when the stake was added
        uint256 addBlock;
        // the block number when the stake was removed (set to 0 if not removed)
        uint256 removeBlock;
        // the block number when the stake was withdrawn (set to 0 if not withdrawn)
        uint256 withdrawBlock;
    }

    function _activeStakeAmount(
        Stake memory stake
    ) internal pure returns (uint256) {
        if (
            stake.addBlock > 0 &&
            stake.removeBlock == 0 &&
            stake.withdrawBlock == 0
        ) {
            return stake.amount;
        } else {
            return 0;
        }
    }

    function _pendingStakeAmount(
        Stake memory stake
    ) internal pure returns (uint256) {
        if (
            stake.addBlock > 0 &&
            stake.removeBlock > 0 &&
            stake.withdrawBlock == 0
        ) {
            return stake.amount;
        } else {
            return 0;
        }
    }

    function _withdrawnStakeAmount(
        Stake memory stake
    ) internal pure returns (uint256) {
        if (
            stake.addBlock > 0 &&
            stake.removeBlock > 0 &&
            stake.withdrawBlock > 0
        ) {
            return stake.amount;
        } else {
            return 0;
        }
    }

    function _calcActiveStake(
        AddressStakingLibrary.Stake[] memory stakes
    ) internal pure returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < stakes.length; i++) {
            total += _activeStakeAmount(stakes[i]);
        }
        return total;
    }

    function _calcPendingStake(
        AddressStakingLibrary.Stake[] memory stakes
    ) internal pure returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < stakes.length; i++) {
            total += _pendingStakeAmount(stakes[i]);
        }
        return total;
    }

    function _calcWithdrawnStake(
        AddressStakingLibrary.Stake[] memory stakes
    ) internal pure returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < stakes.length; i++) {
            total += _withdrawnStakeAmount(stakes[i]);
        }
        return total;
    }

    function _isStakeRemovable(
        AddressStakingLibrary.Stake memory stake
    ) internal pure returns (bool) {
        return
            stake.addBlock > 0 &&
            stake.removeBlock == 0 &&
            stake.withdrawBlock == 0;
    }

    function _isStakeWithdrawable(
        AddressStakingLibrary.Stake memory stake,
        uint256 minWithdrawalBlocks
    ) internal view returns (bool) {
        return
            stake.addBlock > 0 &&
            stake.removeBlock > 0 &&
            stake.withdrawBlock == 0 &&
            block.number >= (stake.removeBlock + minWithdrawalBlocks);
    }
}
