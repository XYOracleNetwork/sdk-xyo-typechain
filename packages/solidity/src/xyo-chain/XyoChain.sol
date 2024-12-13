// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract XyoChain {
    // The chain id from which the chain is forked (zero if it is a genesis chain)
    address forkFrom;

    // The chain id of the chain (address from _privateKey)
    address chainId;

    // The public key of the chain (must match the chain id)
    uint256 privateKey;

    constructor(
        address _chainId, // The address of the privateKey supplied
        uint256 _privateKey, // The private key that is used to cosign the chain for continuity in XYO
        address _forkFrom // The chain id from which the chain is forked (zero if it is a genesis chain)
    ) {
        chainId = _chainId;
        privateKey = _privateKey;
        forkFrom = _forkFrom;
    }
}
