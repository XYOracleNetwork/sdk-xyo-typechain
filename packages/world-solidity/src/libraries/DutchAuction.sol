// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "../interfaces/IAuction.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./TimeConstants.sol";
import "./PercentConstants.sol";

library DutchAuction {
    using Math for uint256;

    uint256 constant DUTCH_DROP_YEAR_PERCENT = 16;
    uint256 constant DUTCH_DROP_QUARTER_PERCENT = 11247;
    uint256 constant DUTCH_DROP_WEEK_PERCENT = 84528;
    uint256 constant DUTCH_DROP_DAY_PERCENT = 97627;
    uint256 constant DUTCH_DROP_HOUR_PERCENT = 99900;

    function _calcDutchAuctionPrice(
        uint256 basePrice,
        uint256 age
    ) internal pure returns (uint256) {
        uint256 remainingAge = age / 15; //seconds to minutes, but switch to quarter from year
        uint256 remainingPrice = basePrice;

        uint256 dropYears = remainingAge / TimeConstants.MINUTES_IN_YEAR;
        remainingAge =
            remainingAge -
            (dropYears * TimeConstants.MINUTES_IN_YEAR);

        uint256 dropQuarters = remainingAge / TimeConstants.MINUTES_IN_QUARTER;
        remainingAge =
            remainingAge -
            (dropQuarters * TimeConstants.MINUTES_IN_QUARTER);

        uint256 dropWeeks = remainingAge / TimeConstants.MINUTES_IN_WEEK;
        remainingAge =
            remainingAge -
            (dropWeeks * TimeConstants.MINUTES_IN_WEEK);

        uint256 dropDays = remainingAge / TimeConstants.MINUTES_IN_DAY;
        remainingAge = remainingAge - (dropDays * TimeConstants.MINUTES_IN_DAY);

        uint256 dropHours = remainingAge / TimeConstants.MINUTES_IN_HOUR;
        remainingAge =
            remainingAge -
            (dropHours * TimeConstants.MINUTES_IN_HOUR);

        for (uint8 x = 0; x < dropYears; x++) {
            remainingPrice = remainingPrice.mulDiv(
                DUTCH_DROP_YEAR_PERCENT,
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        for (uint8 x = 0; x < dropQuarters; x++) {
            remainingPrice = remainingPrice.mulDiv(
                DUTCH_DROP_QUARTER_PERCENT,
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        for (uint8 x = 0; x < dropWeeks; x++) {
            remainingPrice = remainingPrice.mulDiv(
                DUTCH_DROP_WEEK_PERCENT,
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        for (uint8 x = 0; x < dropDays; x++) {
            remainingPrice = remainingPrice.mulDiv(
                DUTCH_DROP_DAY_PERCENT,
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        for (uint8 x = 0; x < dropHours; x++) {
            remainingPrice = remainingPrice.mulDiv(
                DUTCH_DROP_HOUR_PERCENT,
                PercentConstants.MICRO_PERCENT_DIV
            );
        }

        if (remainingPrice == 0) {
            remainingPrice = 1;
        }

        return remainingPrice;
    }

    function _dutchAuctionActive(
        IAuction auction,
        uint256 id
    ) internal view returns (bool) {
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

    function _dutchAuctionPrice(
        IAuction auction,
        uint256 id
    ) internal view returns (uint256) {
        if (!_dutchAuctionActive(auction, id)) {
            return 0;
        }
        uint256 price = _calcDutchAuctionPrice(
            auction.startingBid(id),
            block.timestamp - auction.endTime(id)
        );
        if (price == 0) {
            return 1;
        }
        return price;
    }
}
