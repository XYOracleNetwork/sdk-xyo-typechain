// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

abstract contract Erc721Store {
    mapping(uint256 => mapping(IERC721 => mapping(uint256 => bool)))
        private _erc721tokenStore;

    function _depositErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) internal returns (bool) {
        token.safeTransferFrom(msg.sender, address(this), tokenId);
        _erc721tokenStore[id][token][tokenId] = true;
        return true;
    }

    function _withdrawErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) internal returns (bool) {
        _erc721tokenStore[id][token][tokenId] = false;
        token.safeTransferFrom(address(this), msg.sender, tokenId);
        return true;
    }

    function _containsErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) internal view returns (bool) {
        return _erc721tokenStore[id][token][tokenId];
    }
}
