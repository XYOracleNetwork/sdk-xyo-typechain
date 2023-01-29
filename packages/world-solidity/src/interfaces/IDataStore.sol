// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IDataStore {
    function data(uint256 id, uint256 slot) external view returns (uint256);

    function setData(
        uint256 id,
        uint256 slot,
        uint256 value
    ) external returns (bool);
}
