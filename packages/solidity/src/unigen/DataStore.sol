// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

abstract contract DataStore {
    mapping(uint256 => mapping(uint256 => uint256)) private _data;

    function _getData(uint256 id, uint256 slot)
        internal
        view
        returns (uint256)
    {
        return _data[id][slot];
    }

    event DataSet(
        address indexed by,
        uint256 indexed id,
        uint256 indexed slot,
        uint256 value
    );

    function _setData(
        uint256 id,
        uint256 slot,
        uint256 value
    ) internal returns (bool) {
        _data[id][slot] = value;
        emit DataSet(msg.sender, id, slot, value);
        return true;
    }
}
