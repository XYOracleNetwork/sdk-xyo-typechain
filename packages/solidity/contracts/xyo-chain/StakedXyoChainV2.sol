// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {XyoChain} from "./XyoChain/XyoChain.sol";
import {AddressStaking} from "./AddressStakingV2/AddressStaking.sol";
import {IXyoChainRewards} from "./XyoChain/IXyoChainRewards.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract StakedXyoChainV2 is XyoChain, AddressStaking {
    // ========== CONSTRUCTOR ==========

    constructor(
        address _forkFromChainId, // The chain id from which the chain is forked (zero if it is a genesis chain)
        uint256 _forkFromLastBlockNumber,
        uint256 _forkFromLastHash,
        IXyoChainRewards _rewardsContract,
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingTokenAddress // The token that is used for staking
    )
        XyoChain(
            _forkFromChainId,
            _forkFromLastBlockNumber,
            _forkFromLastHash,
            _rewardsContract
        )
        AddressStaking(_minWithdrawalBlocks, _stakingTokenAddress)
    {}
}
