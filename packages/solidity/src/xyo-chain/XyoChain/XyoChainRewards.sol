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
        uint256 _minRewardPerBlock
    ) {
        __blockRewardConfig = BlockRewardConfig(
            _initialReward,
            _stepSize,
            _stepFactorNumerator,
            _stepFactorDenominator,
            _minRewardPerBlock
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
