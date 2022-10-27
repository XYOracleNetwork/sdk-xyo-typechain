// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface IMintable {
    function isMinter(address account) external view returns (bool);

    function setMinter(address minter) external returns (bool);

    function minter() external view returns (address);

    function mint(address to, uint256 id) external returns (bool);

    function safeMint(address to, uint256 id) external returns (bool);
}
