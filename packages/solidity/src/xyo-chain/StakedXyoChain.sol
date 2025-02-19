// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./XyoChain/XyoChain.sol";
import "./AddressStaking/AddressStaking.sol";

contract StakedXyoChain is XyoChain, AddressStaking {
    // ========== CONSTRUCTOR ==========

    constructor(
        address _chainSigningAddress, // The address of the privateKey supplied
        uint256 _chainSigningPrivateKey, // The private key that is used to cosign the chain for continuity in XYO
        BlockRewardConfig memory _blockRewardConfig,
        address _forkFromChainId, // The chain id from which the chain is forked (zero if it is a genesis chain)
        uint256 _forkFromLastBlockNumber,
        uint256 _forkFromLastHash,
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingTokenAddress // The token that is used for staking
    )
        XyoChain(
            _chainSigningAddress,
            _chainSigningPrivateKey,
            _blockRewardConfig,
            _forkFromChainId,
            _forkFromLastBlockNumber,
            _forkFromLastHash
        )
        AddressStaking(_minWithdrawalBlocks, _stakingTokenAddress)
    {}
}
