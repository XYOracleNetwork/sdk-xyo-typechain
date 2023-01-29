// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../interfaces/IAuction.sol";
import "./TimeConstants.sol";
import "./PercentConstants.sol";

library DutchAuction {
    using SafeMath for uint256;

    uint256 constant DUTCH_DROP_YEAR_PERCENT = 16;
    uint256 constant DUTCH_DROP_QUARTER_PERCENT = 11247;
    uint256 constant DUTCH_DROP_WEEK_PERCENT = 84528;
    uint256 constant DUTCH_DROP_DAY_PERCENT = 97627;
    uint256 constant DUTCH_DROP_HOUR_PERCENT = 99900;

    function _calcDutchAuctionPrice(uint256 basePrice, uint256 age)
        internal
        pure
        returns (uint256)
    {
        uint256 remainingAge = age / 15; //seconds to minutes, but switch to quarter from year
        uint256 remainingPrice = basePrice;

        uint256 dropYears = remainingAge.div(TimeConstants.MINUTES_IN_YEAR);
        remainingAge = remainingAge.sub(
            dropYears.mul(TimeConstants.MINUTES_IN_YEAR)
        );

        uint256 dropQuarters = remainingAge.div(
            TimeConstants.MINUTES_IN_QUARTER
        );
        remainingAge = remainingAge.sub(
            dropQuarters.mul(TimeConstants.MINUTES_IN_QUARTER)
        );

        uint256 dropWeeks = remainingAge.div(TimeConstants.MINUTES_IN_WEEK);
        remainingAge = remainingAge.sub(
            dropWeeks.mul(TimeConstants.MINUTES_IN_WEEK)
        );

        uint256 dropDays = remainingAge.div(TimeConstants.MINUTES_IN_DAY);
        remainingAge = remainingAge.sub(
            dropDays.mul(TimeConstants.MINUTES_IN_DAY)
        );

        uint256 dropHours = remainingAge.div(TimeConstants.MINUTES_IN_HOUR);
        remainingAge = remainingAge.sub(
            dropHours.mul(TimeConstants.MINUTES_IN_HOUR)
        );

        for (uint8 x = 0; x < dropYears; x++) {
            remainingPrice = remainingPrice.mul(DUTCH_DROP_YEAR_PERCENT).div(
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        for (uint8 x = 0; x < dropQuarters; x++) {
            remainingPrice = remainingPrice.mul(DUTCH_DROP_QUARTER_PERCENT).div(
                    PercentConstants.MICRO_PERCENT_DIV
                );
        }

        for (uint8 x = 0; x < dropWeeks; x++) {
            remainingPrice = remainingPrice.mul(DUTCH_DROP_WEEK_PERCENT).div(
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        for (uint8 x = 0; x < dropDays; x++) {
            remainingPrice = remainingPrice.mul(DUTCH_DROP_DAY_PERCENT).div(
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        for (uint8 x = 0; x < dropHours; x++) {
            remainingPrice = remainingPrice.mul(DUTCH_DROP_HOUR_PERCENT).div(
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        if (remainingPrice == 0) {
            remainingPrice = 1;
        }

        return remainingPrice;
    }

    function _dutchAuctionActive(IAuction auction, uint256 id)
        internal
        view
        returns (bool)
    {
        if (auction.hasMinted(id)) {
            return false;
        }

        if (!auction.started(id)) {
            return false;
        }

        if (!auction.expired(id)) {
            return false;
        }

        if (auction.hasBid(id)) {
            return false;
        }

        return true;
    }

    function _dutchAuctionPrice(IAuction auction, uint256 id)
        internal
        view
        returns (uint256)
    {
        if (!_dutchAuctionActive(auction, id)) {
            return 0;
        }
        uint256 price = _calcDutchAuctionPrice(
            auction.startingBid(id),
            block.timestamp.sub(auction.endTime(id))
        );
        if (price == 0) {
            return 1;
        }
        return price;
    }
}
