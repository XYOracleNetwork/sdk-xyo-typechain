// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./IXyoChain.sol";

contract XyoChain is IXyoChain {
    // The signing address (from _privateKey)
    address private __chainSigningAddress;

    // The public key of the chain (must match the chain id)
    uint256 private __chainSigningPrivateKey;

    // The chain id from which the chain is forked (zero if it is a genesis chain)
    address private __forkedChainId;

    // The blocknumber from which the chain is forked (zero if it is a genesis chain)
    uint256 private __forkedAtBlockNumber;

    // The last hash from which the chain is forked (zero if it is a genesis chain)
    uint256 private __forkedAtHash;

    BlockReward.Config private __blockRewardConfig;

    constructor(
        address _chainSigningAddress,
        uint256 _chainSigningPrivateKey,
        BlockReward.Config memory _blockRewardConfig,
        address _forkedChainId,
        uint256 _forkedAtLastBlockNumber,
        uint256 _forkedAtLastHash
    ) {
        __chainSigningAddress = _chainSigningAddress;
        __chainSigningPrivateKey = _chainSigningPrivateKey;
        __blockRewardConfig = _blockRewardConfig;
        __forkedChainId = _forkedChainId;
        __forkedAtBlockNumber = _forkedAtLastBlockNumber;
        __forkedAtHash = _forkedAtLastHash;
        emit ChainCreated(
            address(this),
            _chainSigningAddress,
            _chainSigningPrivateKey,
            _forkedChainId,
            _forkedAtLastBlockNumber,
            _forkedAtLastHash
        );
    }

    function chainId() external view returns (address) {
        return address(this);
    }

    function chainSigningAddress() external view returns (address) {
        return __chainSigningAddress;
    }

    function chainSigningPrivateKey() external view returns (uint256) {
        return __chainSigningPrivateKey;
    }

    function forkedChainId() external view returns (address) {
        return __forkedChainId;
    }

    function forkedAtBlockNumber() external view returns (uint256) {
        return __forkedAtBlockNumber;
    }

    function forkedAtHash() external view returns (uint256) {
        return __forkedAtHash;
    }

    function calcBlockReward(
        uint256 blockNumber
    ) public view returns (uint256) {
        return BlockReward.calc(blockNumber, __blockRewardConfig);
    }

    function calcBlockRewardPure(
        uint256 blockNumber,
        BlockReward.Config memory config
    ) public pure returns (uint256) {
        return BlockReward.calc(blockNumber, config);
    }

    function calc(
        uint256 blockNumber,
        BlockRewardConfig memory config
    ) internal pure returns (uint256) {
        uint256 step = blockNumber / config.stepSize;
        uint256 poweredNumerator = config.stepFactorNumerator ** step;
        uint256 poweredDenominator = config.stepFactorDenominator ** step;
        uint256 calcReward = (config.initialReward * poweredNumerator) /
            poweredDenominator;
        if (calcReward < config.minRewardPerBlock) {
            return config.minRewardPerBlock;
        }
        return calcReward;
    }
}
