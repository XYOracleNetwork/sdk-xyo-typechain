// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

library BlockReward {
    struct Config {
        uint256 initialReward;
        uint256 stepSize;
        uint256 stepFactorNumerator;
        uint256 stepFactorDenominator;
        uint256 minRewardPerBlock;
    }

    function calc(
        uint256 blockNumber,
        Config calldata config
    ) public pure returns (uint256) {
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
