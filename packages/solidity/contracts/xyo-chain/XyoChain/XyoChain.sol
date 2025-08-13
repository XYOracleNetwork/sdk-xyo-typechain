// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {IXyoChain} from "./IXyoChain.sol";
import {IXyoChainRewards} from "./IXyoChainRewards.sol";

contract XyoChain is IXyoChain {
    // The chain id from which the chain is forked (zero if it is a genesis chain)
    address private __forkedChainId;

    // The blocknumber from which the chain is forked (zero if it is a genesis chain)
    uint256 private __forkedAtBlockNumber;

    // The last hash from which the chain is forked (zero if it is a genesis chain)
    uint256 private __forkedAtHash;

    IXyoChainRewards private __rewardsContract;

    constructor(
        address _forkedChainId,
        uint256 _forkedAtLastBlockNumber,
        uint256 _forkedAtLastHash,
        IXyoChainRewards _rewardsContract
    ) {
        __forkedChainId = _forkedChainId;
        __forkedAtBlockNumber = _forkedAtLastBlockNumber;
        __forkedAtHash = _forkedAtLastHash;
        __rewardsContract = _rewardsContract;
        emit ChainCreated(
            address(this),
            _forkedChainId,
            _forkedAtLastBlockNumber,
            _forkedAtLastHash,
            _rewardsContract
        );
    }

    function chainId() external view returns (address) {
        return address(this);
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

    function rewardsContract() external view returns (IXyoChainRewards) {
        return __rewardsContract;
    }
}
