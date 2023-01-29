// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../IAuction.sol";
import "../IMinimumBid.sol";
import "../IBidFee.sol";

interface IMinimumBidFeeAuction is IAuction, IBidFee, IMinimumBid {}
