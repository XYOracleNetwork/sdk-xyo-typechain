// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

interface IXyoChain {
    function chainId() external view returns (address);
    function chainSigningAddress() external view returns (address);
    function chainSigningPrivateKey() external view returns (uint256);
    function forkedChainId() external view returns (address);
    function forkedAtBlockNumber() external view returns (uint256);
    function forkedAtHash() external view returns (uint256);
    function firstBlockHash() external view returns (uint256);

    // This is when a chain is created
    event ChainCreated(
        address indexed chainId,
        address indexed chainSigningAddress,
        uint256 chainSigningPrivateKey,
        address indexed forkedChainId,
        uint256 forkedAtLastBlockNumber,
        uint256 forkedAtLastHash,
        uint256 firstBlockHash
    );
}
