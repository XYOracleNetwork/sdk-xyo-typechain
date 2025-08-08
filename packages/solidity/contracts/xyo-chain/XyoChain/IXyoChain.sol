// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./IXyoChainRewards.sol";

interface IXyoChain {
    function chainId() external view returns (address);

    function forkedChainId() external view returns (address);

    function forkedAtBlockNumber() external view returns (uint256);

    function forkedAtHash() external view returns (uint256);

    function rewardsContract() external view returns (IXyoChainRewards);

    // This is when a chain is created
    event ChainCreated(
        address indexed chainId,
        address indexed forkedChainId,
        uint256 forkedAtLastBlockNumber,
        uint256 forkedAtLastHash,
        IXyoChainRewards rewardsContract
    );
}
