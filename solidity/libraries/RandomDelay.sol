// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./TimeConstants.sol";
import "../interfaces/IRandomSlots.sol";

library RandomDelay {
    uint8 constant TIME_DILATION = 0x00; //change this to 0x00 before real deploy
    uint8 constant SALE_DAYS_BASE = 0x07;

    function _random(uint256 seed) private view returns (bytes32) {
        bytes memory part1 = abi.encode(block.difficulty);
        bytes memory part2 = abi.encode(seed);
        for (uint256 i = 0; i < 32; i++) {
            part1[i] = part1[i] ^ part2[i];
        }
        return keccak256(part1);
    }

    function _calcRandomPart(
        uint8 odds,
        int16 weight,
        uint8 rndRoll,
        uint8 rndWeight
    ) private pure returns (int256) {
        if (rndRoll <= odds) {
            return (int256(rndWeight) * weight) / int256(256);
        }
        return 0;
    }

    function _randomDelay(
        IRandomSlots slots,
        uint256 base,
        uint256 seed
    ) internal view returns (uint32) {
        bytes32 rnd = _random(seed);
        int256 total = int256(base);
        uint8 slotCount = slots.randomSlotCount();
        for (uint8 i = 0; i < slotCount; i++) {
            uint8 odds = slots.randomSlotOdds(i);
            int16 weight = slots.randomSlotWeight(i);
            total =
                total +
                _calcRandomPart(
                    odds,
                    weight,
                    uint8(rnd[i * 2]),
                    uint8(rnd[i * 2 + 1])
                );
        }
        require(total > 0, "Invalid random constants");
        return uint32(total) >> TIME_DILATION;
    }
}
