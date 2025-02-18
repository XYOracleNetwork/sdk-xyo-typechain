// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IXyoChain {
    function chainId() external view returns (address);
    function chainSigningAddress() external view returns (address);
    function chainSigningPrivateKey() external view returns (uint256);
    function forkedChainId() external view returns (address);
    function forkedAtBlockNumber() external view returns (uint256);
    function forkedAtHash() external view returns (uint256);
    function calcBlockRewardPure(
        uint256 blockNumber,
        uint256 initialReward,
        uint256 stepSize,
        uint256 stepFactorNumerator,
        uint256 stepFactorDenominator,
        uint256 minRewardPerBlock
    ) external pure returns (uint256);

    function calcBlockReward(
        uint256 blockNumber
    ) external view returns (uint256);

    /*
        The Genesis block will have a block id of 0 and a block number of 0
    */

    // This is when a chain is created
    event ChainCreated(
        address indexed chainId,
        address indexed chainSigningAddress,
        uint256 chainSigningPrivateKey,
        address indexed forkedChainId,
        uint256 forkedAtLastBlockNumber,
        uint256 forkedAtLastHash
    );
}
