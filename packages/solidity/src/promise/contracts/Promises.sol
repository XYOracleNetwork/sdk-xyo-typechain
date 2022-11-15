// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../interfaces/IPromises.sol";

abstract contract Promises is IPromises {
    struct Promise {
        /* The minimum stake that the answering node must have in the promise resolver */
        uint256 minimumStake;
        /* The number of blocks that will pass before the completion is allowed for the promise */
        uint32 verifyDelay;
        /* The number of blocks that will pass before the promise auto expires */
        uint32 expireDelay;
        uint256 answerHash;
        uint256[] answer;
        //the JSON paths to the fields requested
        bytes[] paths;
    }

    mapping(uint256 => Promise) public promises;
}
