// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../../../interfaces/IMintable.sol";

interface IMintableErc721 is IERC721, IMintable {}
