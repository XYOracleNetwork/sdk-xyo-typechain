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

    constructor(
        address _chainSigningAddress,
        uint256 _chainSigningPrivateKey,
        address _forkedChainId,
        uint256 _forkedAtLastBlockNumber,
        uint256 _forkedAtLastHash
    ) {
        __chainSigningAddress = _chainSigningAddress;
        __chainSigningPrivateKey = _chainSigningPrivateKey;
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
}
