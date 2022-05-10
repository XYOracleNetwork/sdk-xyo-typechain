// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IErc721Store {
    function depositErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) external returns (bool);

    function withdrawErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) external returns (bool);

    function containsErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) external view returns (bool);
}
