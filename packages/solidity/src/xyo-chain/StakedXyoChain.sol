// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./XyoChain/XyoChain.sol";
import "./AddressStaking/AddressStaking.sol";

contract StakedXyoChain is XyoChain, AddressStaking {
    // ========== CONSTRUCTOR ==========

    constructor(
        address _chainId, // The address of the privateKey supplied
        uint256 _privateKey, // The private key that is used to cosign the chain for continuity in XYO
        address _forkFromChainId, // The chain id from which the chain is forked (zero if it is a genesis chain)
        uint256 _forkFromLastBlockNumber,
        uint256 _forkFromLastHash,
        uint256 _firstBlockHash,
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingTokenAddress // The token that is used for staking
    )
        XyoChain(
            _chainId,
            _privateKey,
            _forkFromChainId,
            _forkFromLastBlockNumber,
            _forkFromLastHash,
            _firstBlockHash
        )
        AddressStaking(_minWithdrawalBlocks, _stakingTokenAddress)
    {}
}
