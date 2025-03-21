// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./IXyoChainRewards.sol";

contract XyoChainRewards is IXyoChainRewards {
    BlockRewardConfig private __blockRewardConfig;

    constructor(
        uint256 _initialReward,
        uint256 _stepSize,
        uint256 _stepFactorNumerator,
        uint256 _stepFactorDenominator,
        uint256 _minRewardPerBlock,
        uint256 _genesisReward,
        uint256 _floorMask
    ) {
        __blockRewardConfig = BlockRewardConfig(
            _initialReward,
            _stepSize,
            _stepFactorNumerator,
            _stepFactorDenominator,
            _minRewardPerBlock,
            _genesisReward,
            _floorMask
        );
    }

    function calcBlockReward(
        uint256 blockNumber
    ) public view returns (uint256) {
        return internalBlockRewardCalc(blockNumber, __blockRewardConfig);
    }

    function calcBlockRewardPure(
        uint256 blockNumber,
        BlockRewardConfig memory config
    ) public pure returns (uint256) {
        return internalBlockRewardCalc(blockNumber, config);
    }

    function internalBlockRewardCalc(
        uint256 blockNumber,
        BlockRewardConfig memory config
    ) internal pure returns (uint256) {
        if (blockNumber == 0) {
            return config.genesisReward;
        }

        uint256 step = blockNumber / config.stepSize;

        uint256 reward = config.initialReward;

        for (uint256 i = 0; i < step; i++) {
            reward =
                (config.stepFactorNumerator * reward) /
                config.stepFactorDenominator;
            reward = reward & config.floorMask;
        }
        if (reward < config.minRewardPerBlock) {
            return config.minRewardPerBlock;
        }
        return reward;
    }
}
