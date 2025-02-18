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

    // Reward Constants
    uint256 private __initialReward;
    uint256 private __stepSize;
    uint256 private __stepFactorNumerator;
    uint256 private __stepFactorDenominator;
    uint256 private __minRewardPerBlock;

    constructor(
        address _chainSigningAddress,
        uint256 _chainSigningPrivateKey,
        uint256 _initialReward,
        uint256 _stepSize,
        uint256 _stepFactorNumerator,
        uint256 _stepFactorDenominator,
        uint256 _minRewardPerBlock,
        address _forkedChainId,
        uint256 _forkedAtLastBlockNumber,
        uint256 _forkedAtLastHash
    ) {
        __chainSigningAddress = _chainSigningAddress;
        __chainSigningPrivateKey = _chainSigningPrivateKey;
        __initialReward = _initialReward;
        __stepSize = _stepSize;
        __stepFactorNumerator = _stepFactorNumerator;
        __stepFactorDenominator = _stepFactorDenominator;
        __minRewardPerBlock = _minRewardPerBlock;
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
        return
            calcBlockRewardPure(
                blockNumber,
                __initialReward,
                __stepSize,
                __stepFactorNumerator,
                __stepFactorDenominator,
                __minRewardPerBlock
            );
    }

    function calcBlockRewardPure(
        uint256 blockNumber,
        uint256 initialReward,
        uint256 stepSize,
        uint256 stepFactorNumerator,
        uint256 stepFactorDenominator,
        uint256 minRewardPerBlock
    ) public pure returns (uint256) {
        uint256 step = blockNumber / stepSize;
        uint256 poweredNumerator = stepFactorNumerator ** step;
        uint256 poweredDenominator = stepFactorDenominator ** step;
        uint256 calcReward = (initialReward * poweredNumerator) /
            poweredDenominator;
        if (calcReward < minRewardPerBlock) {
            return minRewardPerBlock;
        }
        return calcReward;
    }
}
