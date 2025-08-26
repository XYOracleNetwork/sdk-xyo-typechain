// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {XyoChain} from "./XyoChain/XyoChain.sol";
import {AddressStakingV2} from "./AddressStakingV2/AddressStakingV2.sol";
import {IXyoChainRewards} from "./XyoChain/IXyoChainRewards.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract StakedXyoChainV2 is XyoChain, AddressStakingV2 {
    // ========== CONSTRUCTOR ==========

    constructor(
        address _forkFromChainId, // The chain id from which the chain is forked (zero if it is a genesis chain)
        uint256 _forkFromLastBlockNumber,
        uint256 _forkFromLastHash,
        IXyoChainRewards _rewardsContract,
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingTokenAddress, // The token that is used for staking
        uint256 _maxStakersPerAddress,
        address _unlimitedStakerAddress //a single address that can be staked by an unlimited number of stakers - to be used for an unslashable address
    )
        XyoChain(
            _forkFromChainId,
            _forkFromLastBlockNumber,
            _forkFromLastHash,
            _rewardsContract
        )
        AddressStakingV2(
            _minWithdrawalBlocks,
            _stakingTokenAddress,
            _maxStakersPerAddress,
            _unlimitedStakerAddress
        )
    {}
}
