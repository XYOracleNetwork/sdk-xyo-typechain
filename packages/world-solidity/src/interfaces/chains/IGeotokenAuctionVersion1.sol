// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../IGeotokenConsumer.sol";
import "./IMinimumBidFeeAuctionVersion1.sol";
import "../IMintNow.sol";

interface IGeotokenAuctionVersion1 is
    IMinimumBidFeeAuctionVersion1,
    IMintNow,
    IGeotokenConsumer
{}
