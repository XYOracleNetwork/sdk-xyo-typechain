// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

struct BlockRewardConfig {
    uint256 initialReward;
    uint256 stepSize;
    uint256 stepFactorNumerator;
    uint256 stepFactorDenominator;
    uint256 minRewardPerBlock;
    uint256 genesisReward;
}

interface IXyoChainRewards {
    function calcBlockRewardPure(
        uint256 blockNumber,
        BlockRewardConfig calldata config
    ) external pure returns (uint256);

    function calcBlockReward(
        uint256 blockNumber
    ) external view returns (uint256);
}
