// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

library TimeConstants {
    uint32 constant SECONDS_IN_MINUTE = 60;
    uint32 constant MINUTES_IN_HOUR = 60;
    uint32 constant MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;
    uint32 constant MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY;
    uint32 constant MINUTES_IN_QUARTER = 13 * MINUTES_IN_WEEK;
    uint32 constant MINUTES_IN_YEAR = 4 * MINUTES_IN_QUARTER;
}
