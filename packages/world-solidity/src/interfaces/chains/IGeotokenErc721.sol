// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./IMintableErc721.sol";
import "../IParentable.sol";

interface IGeotokenErc721 is IMintableErc721, IParentable {
    function exists(uint256 id) external view returns (bool);
}
