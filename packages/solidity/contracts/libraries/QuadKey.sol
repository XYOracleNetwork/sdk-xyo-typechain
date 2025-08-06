// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

//each level is represented by two bits
//the zoom of the key is defined by the first byte

library QuadKey {
    uint256 constant QUADKEY_ZOOM_BYTE = 31;
    uint256 constant QUADKEY_ZOOM_LEVELS = 124;
    uint256 constant QUADKEY_ZOOM_SHIFT = QUADKEY_ZOOM_BYTE * 8;
    uint256 constant QUADKEY_ZOOM_MASK = 0xff << QUADKEY_ZOOM_SHIFT;

    function zoomFromKey(uint256 key) internal pure returns (uint8) {
        return uint8((key & QUADKEY_ZOOM_MASK) >> QUADKEY_ZOOM_SHIFT);
    }

    function idFromKey(uint256 key) internal pure returns (uint256) {
        return (key | QUADKEY_ZOOM_MASK) ^ QUADKEY_ZOOM_MASK;
    }

    function createKey(uint8 zoom, uint256 id) internal pure returns (uint256) {
        return id | (uint256(zoom) << QUADKEY_ZOOM_SHIFT);
    }

    function parent(uint256 key) internal pure returns (uint256) {
        uint8 zoomLevel = zoomFromKey(key);
        require(zoomLevel > 0, "Invalid zoom level");
        return createKey(zoomLevel - 1, idFromKey(key) >> 2);
    }

    function child(uint256 key, uint8 index) internal pure returns (uint256) {
        require(index < 4, "Index out of range");
        uint8 zoomLevel = zoomFromKey(key);
        require(zoomLevel < QUADKEY_ZOOM_LEVELS, "Zoom out of range");
        return createKey(zoomLevel + 1, (idFromKey(key) << 2) | index);
    }

    function valid(uint256 key) internal pure returns (bool) {
        uint8 zoom = zoomFromKey(key);
        uint256 id = idFromKey(key);
        uint256 shift = QUADKEY_ZOOM_LEVELS - zoom;
        return id == (id << shift) >> shift;
    }
}
