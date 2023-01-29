// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../IDataStore.sol";
import "../IErc20Store.sol";
import "../IErc721Store.sol";
import "../IMintable.sol";
import "../ILockable.sol";
import "../IParentable.sol";
import "./IGeotokenErc721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

interface IXyoWorldGeotokens is
    IDataStore,
    IErc20Store,
    IErc721Store,
    ILockable,
    IMintable,
    IParentable,
    IGeotokenErc721,
    IERC721Metadata,
    IERC721Enumerable
{
    event MinterSet(address newMinter);
    event Minted(address indexed to, uint256 indexed id);
    event SafeMinted(address indexed to, uint256 indexed id);
    event DataSet(uint256 indexed id, uint256 indexed slot, uint256 value);
    event Erc20Deposited(
        address indexed from,
        uint256 indexed id,
        IERC20 indexed token,
        uint256 amount,
        uint256 balance
    );
    event Erc20Withdrew(
        address indexed to,
        uint256 indexed id,
        IERC20 indexed token,
        uint256 amount,
        uint256 balance
    );
    event Erc721Deposited(
        address indexed from,
        uint256 indexed id,
        IERC721 indexed token,
        uint256 tokenId
    );
    event Erc721Withdrew(
        address indexed to,
        uint256 indexed id,
        IERC721 indexed token,
        uint256 tokenId
    );

    function isOwner(uint256 id) external view returns (bool);
}
