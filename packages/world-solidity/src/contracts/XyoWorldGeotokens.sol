// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "../interfaces/chains/IXyoWorldGeotokens.sol";
import "./Erc20Store.sol";
import "./Erc721Store.sol";
import "./DataStore.sol";
import "../libraries/QuadKey.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract XyoWorldGeotokens is
    Erc20Store,
    Erc721Store,
    DataStore,
    IXyoWorldGeotokens,
    ERC721Enumerable
{
    address private _minter;
    string private baseURIValue;

    uint8 constant CHILDREN_UNLOCK_QUOTA = 2;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory baseURI
    ) ERC721(_name, _symbol) {
        baseURIValue = baseURI;
        _minter = msg.sender;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURIValue;
    }

    modifier onlyOwner(uint256 id) {
        require(isOwner(id), "Only the owner of the geotoken can do this");
        _;
    }

    modifier onlyMinter() {
        require(isMinter(msg.sender), "Only minter can do this");
        _;
    }

    function parentOf(uint256 id) public pure override returns (uint256) {
        require(QuadKey.valid(id), "Key not valid");
        return QuadKey.parent(id);
    }

    function isOwner(uint256 id) public view override returns (bool) {
        return ownerOf(id) == msg.sender;
    }

    function exists(uint256 id) public view override returns (bool) {
        return _ownerOf(id) != address(0);
    }

    function isMinter(address account) public view override returns (bool) {
        return minter() == account;
    }

    function setMinter(
        address newMinter
    ) public override onlyMinter returns (bool) {
        _minter = newMinter;
        emit MinterSet(newMinter);
        return true;
    }

    function minter() public view override returns (address) {
        return _minter;
    }

    function mint(
        address to,
        uint256 id
    ) public override onlyMinter returns (bool) {
        require(QuadKey.valid(id), "Id not valid");
        _mint(to, id);
        emit Minted(to, id);
        return true;
    }

    function safeMint(
        address to,
        uint256 id
    ) public override onlyMinter returns (bool) {
        require(QuadKey.valid(id), "Id not valid");
        _safeMint(to, id);
        emit SafeMinted(to, id);
        return true;
    }

    function data(
        uint256 id,
        uint256 slot
    ) public view override returns (uint256) {
        return _getData(id, slot);
    }

    function setData(
        uint256 id,
        uint256 slot,
        uint256 value
    ) public override onlyOwner(id) returns (bool) {
        bool result = _setData(id, slot, value);
        emit DataSet(id, slot, value);
        return result;
    }

    function withdrawErc20(
        uint256 id,
        IERC20 token,
        uint256 amount
    ) public override onlyOwner(id) returns (uint256) {
        require(!locked(id), "Geotoken Locked");
        uint256 result = _withdrawErc20(id, token, amount);
        emit Erc20Withdrew(msg.sender, id, token, amount, result);
        return result;
    }

    function depositErc20(
        uint256 id,
        IERC20 token,
        uint256 amount
    ) public override returns (uint256) {
        uint256 result = _depositErc20(id, token, amount);
        emit Erc20Deposited(msg.sender, id, token, amount, result);
        return result;
    }

    function balanceErc20(
        uint256 id,
        IERC20 token
    ) public view override returns (uint256) {
        return _balanceErc20(id, token);
    }

    function depositErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) public override returns (bool) {
        bool result = _depositErc721(id, token, tokenId);
        emit Erc721Deposited(msg.sender, id, token, tokenId);
        return result;
    }

    function withdrawErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) public override onlyOwner(id) returns (bool) {
        require(!locked(id), "Geotoken Locked");
        emit Erc721Withdrew(msg.sender, id, token, tokenId);
        return _withdrawErc721(id, token, tokenId);
    }

    function containsErc721(
        uint256 id,
        IERC721 token,
        uint256 tokenId
    ) public view override returns (bool) {
        return _containsErc721(id, token, tokenId);
    }

    function locked(uint256 id) public view override returns (bool) {
        uint8 childrenExist = 0;
        for (uint8 i = 0; i < 4; i++) {
            uint256 childId = QuadKey.child(id, i);
            if (exists(childId)) {
                childrenExist += 1;
            }
        }
        return (childrenExist < CHILDREN_UNLOCK_QUOTA);
    }
}
