// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract XyoChain {
    // The chain id of the chain (address from _privateKey)
    address chainId;

    // The public key of the chain (must match the chain id)
    uint256 privateKey;

    // The chain id from which the chain is forked (zero if it is a genesis chain)
    address forkFromChainId;

    // The blocknumber from which the chain is forked (zero if it is a genesis chain)
    uint256 forkFromLastBlockNumber;

    // The last hash from which the chain is forked (zero if it is a genesis chain)
    uint256 forkFromLastHash;

    constructor(
        address _chainId,
        uint256 _privateKey,
        address _forkFromChainId,
        uint256 _forkFromLastBlockNumber,
        uint256 _forkFromLastHash
    ) {
        chainId = _chainId;
        privateKey = _privateKey;
        forkFromChainId = _forkFromChainId;
        forkFromLastBlockNumber = _forkFromLastBlockNumber;
        forkFromLastHash = _forkFromLastHash;
    }
}
