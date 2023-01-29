// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../interfaces/IRandomSlots.sol";
import "../interfaces/chains/IBurnableErc20.sol";
import "../interfaces/chains/IXyoWorldMinterVersion1.sol";
import "../interfaces/IBurnable.sol";
import "../libraries/MintNowVersion1.sol";
import "../libraries/DutchAuctionVersion1.sol";
import "../libraries/BidFeeVersion1.sol";
import "../libraries/RandomDelay.sol";
import "../libraries/MinimumBidVersion1.sol";
import "../libraries/MinimumBidFeeVersion1.sol";
import "../libraries/QuadKey.sol";
import "../libraries/TimeConstants.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AuctionVersion1.sol";

contract XyoWorldMinterVersion1 is AuctionVersion1, IXyoWorldMinterVersion1 {
    using SafeMath for uint256;
    using SafeERC20 for IBurnableErc20;
    using DutchAuctionVersion1 for XyoWorldMinterVersion1;
    using BidFeeVersion1 for XyoWorldMinterVersion1;
    using RandomDelay for XyoWorldMinterVersion1;
    using MintNowVersion1 for XyoWorldMinterVersion1;
    using MinimumBidVersion1 for XyoWorldMinterVersion1;
    using MinimumBidFeeVersion1 for XyoWorldMinterVersion1;

    struct RandomSlot {
        int16 weight; //the range of minutes to add if this slot is used
        uint8 odds; //odds that this slot is used (out of 256, not 100)
    }

    RandomSlot[8] _randomSlots;

    function initRandomSlots() private returns (bool) {
        _randomSlots[0] = RandomSlot(
            int16(int32(30 * TimeConstants.MINUTES_IN_DAY)),
            0xf
        );
        _randomSlots[1] = RandomSlot(
            int16(int32(15 * TimeConstants.MINUTES_IN_DAY)),
            0x1f
        );
        _randomSlots[2] = RandomSlot(
            int16(int32(7 * TimeConstants.MINUTES_IN_DAY)),
            0x3f
        );
        _randomSlots[3] = RandomSlot(
            int16(int32(3 * TimeConstants.MINUTES_IN_DAY)),
            0x7f
        );
        _randomSlots[4] = RandomSlot(
            int16(int32(1 * TimeConstants.MINUTES_IN_DAY)),
            0xff
        );
        _randomSlots[5] = RandomSlot(
            -int16(int32(1 * TimeConstants.MINUTES_IN_DAY)),
            0x7f
        );
        _randomSlots[6] = RandomSlot(
            -int16(int32(5 * TimeConstants.MINUTES_IN_DAY) / 2),
            0x3f
        );
        _randomSlots[7] = RandomSlot(
            -int16(int32(7 * TimeConstants.MINUTES_IN_DAY) / 2),
            0x1f
        );
        return true;
    }

    IXyoWorldGeotokens private _geotokens;
    IBurnableErc20 private _currency;

    address internal _owner = msg.sender;
    uint8 internal _childStartingBidPercent = 50;
    uint256 private _saleDelayMinutesBase = 7 * TimeConstants.MINUTES_IN_DAY;

    constructor(
        IXyoWorldGeotokens geotokenssToSell,
        IBurnableErc20 currencyToPay
    ) {
        initRandomSlots();
        _geotokens = geotokenssToSell;
        _currency = currencyToPay;
    }

    uint256[5] _mintingPriceTokenFlowMicroPercent = [
        75000,
        16000,
        4000,
        1000,
        250
    ];

    function _flowTokens(uint256 id, uint256 tokenCount)
        internal
        returns (bool)
    {
        uint256 targetId = id;
        uint256 rootId = QuadKey.createKey(0, 0);
        uint256 remainingTokens = tokenCount;
        for (uint8 x = 0; x < _mintingPriceTokenFlowMicroPercent.length; x++) {
            if (!_geotokens.exists(targetId)) {
                break;
            }
            uint256 tokensToDeposit = remainingTokens
                .mul(_mintingPriceTokenFlowMicroPercent[x])
                .div(PercentConstants.MICRO_PERCENT_DIV);
            _currency.approve(address(_geotokens), tokensToDeposit);
            _geotokens.depositErc20(targetId, _currency, tokensToDeposit);
            emit TokensFlowed(targetId, id, tokensToDeposit);
            remainingTokens = remainingTokens.sub(tokensToDeposit);
            if (targetId == rootId) {
                //we reached the top
                break;
            }
            targetId = _geotokens.parentOf(targetId);
        }
        _currency.burn(remainingTokens);
        emit TokensBurned(id, remainingTokens);
        return true;
    }

    function _startAuction(
        uint256 id,
        uint256 initialStartingBid,
        uint32 auctionLength
    ) internal override returns (bool) {
        require(QuadKey.valid(id), "Id not valid");
        bool result = super._startAuction(
            id,
            initialStartingBid,
            auctionLength
        );
        emit AuctionStarted(id, initialStartingBid, auctionLength);
        return result;
    }

    function _makeAvailable(uint256 id, uint256 initialStartingBid) private {
        _startAuction(
            id,
            initialStartingBid,
            _generateAuctionLengthInMinutes(id) *
                TimeConstants.SECONDS_IN_MINUTE
        );
    }

    function _makeChildrenAvailable(uint256 id, uint256 initialStartingBid)
        internal
        returns (bool)
    {
        for (uint8 i = 0; i < 4; i++) {
            _makeAvailable(QuadKey.child(id, i), initialStartingBid);
        }
        return true;
    }

    function randomSlotCount() public view override returns (uint8) {
        return uint8(_randomSlots.length);
    }

    function randomSlotOdds(uint256 slot) public view override returns (uint8) {
        return _randomSlots[slot].odds;
    }

    function randomSlotWeight(uint256 slot)
        public
        view
        override
        returns (int16)
    {
        return _randomSlots[slot].weight;
    }

    function _refundCurrentBid(uint256 id, uint256 fee)
        internal
        returns (uint256)
    {
        if (hasBid(id)) {
            uint256 refundAmount = _auctions[id].bid.add(fee);
            currency().safeTransfer(_auctions[id].bidder, refundAmount);
            _auctions[id].bidder = address(0);
            emit RefundedCurrentBid(_auctions[id].bidder, id, refundAmount);
            return fee;
        }
        return 0;
    }

    function _generateAuctionLengthInMinutes(uint256 id)
        internal
        view
        returns (uint32)
    {
        return this._randomDelay(_saleDelayMinutesBase, id);
    }

    function currency() public view override returns (IBurnableErc20) {
        return _currency;
    }

    function tokens() public view override returns (IMintableErc721) {
        return _geotokens;
    }

    function geotokens() public view override returns (IGeotokenErc721) {
        return _geotokens;
    }

    function hasMinted(uint256 id) public view override returns (bool) {
        return (_geotokens.exists(id));
    }

    function _canMint(uint256 id) private view returns (bool) {
        return started(id) && expired(id) && hasBid(id) && !hasMinted(id);
    }

    function mint(uint256 id) public override returns (bool) {
        uint256 price = 0;

        if (!_canMint(id)) {
            if (this._dutchAuctionActive(id)) {
                price = this._dutchAuctionPrice(id);
            } else {
                require(QuadKey.zoomFromKey(id) > 2, "Buy Now not allowed");
                price = this._mintNowPrice(id);
            }
            _bid(id, price);
        }
        return _mint(id);
    }

    function start(uint256 initialStartingBid, address geotokenZeroOwner)
        public
        override
        returns (bool)
    {
        require(msg.sender == _owner, "Can only be started by owner");
        _geotokens.safeMint(geotokenZeroOwner, QuadKey.createKey(0, 0));
        bool result = _makeChildrenAvailable(
            QuadKey.createKey(0, 0),
            initialStartingBid
        );
        emit MinterStarted(msg.sender, initialStartingBid);
        return result;
    }

    function _bid(uint256 id, uint256 bidAmount) private returns (bool) {
        uint256 fee = this.bidFee(id, bidAmount);
        uint256 totalCost = bidAmount + fee;
        currency().safeTransferFrom(msg.sender, address(this), totalCost);

        _refundCurrentBid(id, fee);

        _auctions[id].bid = bidAmount;
        _auctions[id].bidder = msg.sender;
        emit BidPlaced(msg.sender, id, bidAmount);
        return true;
    }

    function bid(uint256 id, uint256 bidAmount) public override returns (bool) {
        require(started(id), "Auction not started");
        require(!expired(id), "Auction expired");
        require(!hasMinted(id), "Geotoken minted");
        require(bidAmount >= this.minimumBid(id), "Bid too low");

        return _bid(id, bidAmount);
    }

    function _mint(uint256 id) private returns (bool) {
        address winner = bidder(id);
        uint256 amount = currentBid(id);
        _geotokens.safeMint(winner, id);
        _flowTokens(id, amount);
        _makeChildrenAvailable(
            id,
            amount.mul(_childStartingBidPercent).div(
                PercentConstants.PERCENT_DIV
            )
        );
        emit GeotokenMinted(msg.sender, id);
        return true;
    }

    function bidFeePercent() public pure override returns (uint8) {
        return 8;
    }

    function bidFee(uint256 id, uint256 bidAmount)
        public
        view
        override
        returns (uint256)
    {
        return this._bidFee(id, bidAmount);
    }

    function minimumBidIncreasePercent() public pure override returns (uint8) {
        return 8;
    }

    function minimumBid(uint256 id) public view override returns (uint256) {
        return this._minimumBid(id);
    }

    function dutchAuctionActive(uint256 id)
        public
        view
        override
        returns (bool)
    {
        return this._dutchAuctionActive(id);
    }

    function dutchAuctionPrice(uint256 id)
        public
        view
        override
        returns (uint256)
    {
        return this._dutchAuctionPrice(id);
    }

    function calcDutchAuctionPrice(uint256 basePrice, uint256 age)
        public
        pure
        override
        returns (uint256)
    {
        return DutchAuctionVersion1._calcDutchAuctionPrice(basePrice, age);
    }

    function mintNowPrice(uint256 id) public view override returns (uint256) {
        //we do not allow mint-now for first couple levels
        if (QuadKey.zoomFromKey(id) <= 2) {
            return 0;
        }
        return this._mintNowPrice(id);
    }

    function mintNowFee(uint256 id) public view override returns (uint256) {
        return this._mintNowFee(id);
    }
}
