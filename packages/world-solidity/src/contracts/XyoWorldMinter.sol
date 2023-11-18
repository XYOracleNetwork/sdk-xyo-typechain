// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "../interfaces/IRandomSlots.sol";
import "../interfaces/chains/IBurnableErc20.sol";
import "../interfaces/chains/IXyoWorldMinter.sol";
import "../interfaces/IBurnable.sol";
import "../libraries/MintNow.sol";
import "../libraries/DutchAuction.sol";
import "../libraries/BidFee.sol";
import "../libraries/RandomDelay.sol";
import "../libraries/MinimumBid.sol";
import "../libraries/MinimumBidFee.sol";
import "../libraries/QuadKey.sol";
import "../libraries/TimeConstants.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./Auction.sol";

contract XyoWorldMinter is Auction, IXyoWorldMinter {
    using Math for uint256;

    using SafeERC20 for IBurnableErc20;
    using DutchAuction for XyoWorldMinter;
    using BidFee for XyoWorldMinter;
    using RandomDelay for XyoWorldMinter;
    using MintNow for XyoWorldMinter;
    using MinimumBid for XyoWorldMinter;
    using MinimumBidFee for XyoWorldMinter;

    address private _creator;

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
        IXyoWorldGeotokens geotokensToSell,
        IBurnableErc20 currencyToPay
    ) {
        initRandomSlots();
        _geotokens = geotokensToSell;
        _currency = currencyToPay;
        _creator = msg.sender;
    }

    function isCreator(address account) public view returns (bool) {
        return _creator == account;
    }

    modifier onlyCreator() {
        require(isCreator(msg.sender), "Only creator can do this");
        _;
    }

    event CreatorRevoked();

    function revokeCreator() public onlyCreator returns (bool) {
        _creator = address(0x0);
        emit CreatorRevoked();
        return true;
    }

    event MinterTransferred(address newMinter, uint256 amount);

    function transferToNewMinter(
        address newMinter
    ) public onlyCreator returns (bool) {
        uint256 amount = _currency.balanceOf(address(this));
        _currency.safeTransfer(newMinter, amount);
        _geotokens.setMinter(newMinter);
        emit MinterTransferred(newMinter, amount);
        return true;
    }

    uint256[5] _mintingPriceTokenFlowMicroPercent = [
        75000,
        16000,
        4000,
        1000,
        250
    ];

    function _sendMintingFee(
        uint256 id,
        uint256 tokenCount,
        address feeReceiver
    ) internal returns (uint256) {
        uint256 fee = tokenCount / 10; //take 10%
        if (fee > 0) {
            _currency.safeTransfer(feeReceiver, fee);
            emit MintingFeeSent(feeReceiver, id, fee);
            return tokenCount - fee; //returns the balance
        }
        return tokenCount;
    }

    function _flowTokens(
        uint256 id,
        uint256 tokenCount,
        address feeReceiver
    ) internal returns (bool) {
        require(tokenCount > 0, "Tokens to flow can not be 0");

        uint256 targetId = id;
        uint256 rootId = QuadKey.createKey(0, 0);

        _currency.approve(address(_geotokens), tokenCount);

        uint256 baseTokens = tokenCount;
        if (feeReceiver != address(0x0)) {
            baseTokens = _sendMintingFee(id, tokenCount, feeReceiver);
        }
        uint256 remainingTokens = baseTokens;
        require(remainingTokens > 0, "remainingTokens to flow can not be 0");
        for (uint8 x = 0; x < _mintingPriceTokenFlowMicroPercent.length; x++) {
            if (!_geotokens.exists(targetId)) {
                break;
            }
            uint256 tokensToDeposit = baseTokens.mulDiv(
                _mintingPriceTokenFlowMicroPercent[x],
                PercentConstants.MICRO_PERCENT_DIV
            );
            _geotokens.depositErc20(targetId, _currency, tokensToDeposit);
            emit TokensFlowed(targetId, id, tokensToDeposit);
            remainingTokens = remainingTokens - tokensToDeposit;
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
        emit AuctionStarted(msg.sender, id, initialStartingBid, auctionLength);
        return result;
    }

    //xto balance for contract
    function _restoreStateStep0() private returns (bool) {
        //uint256 xyoBalance = 14100231360000000000000000;
        //uint256 xyoBalance = 54875106729056829440000000;
        uint256 xyoBalance = 55099000000000000000000000;
        //uint256 xyoBalance = 175875106729056829440000000;
        currency().safeTransferFrom(msg.sender, address(this), xyoBalance);
        return true;
    }

    //token holders
    //000000000000000000 - 18 Zeros
    function _restoreStateStep1() private returns (bool) {
        address bidder0 = address(0xCe74A760B754F7717e7a62e389D4B153AA753E0e);
        uint256 bid0 = 28500000000000000000000000;
        uint256 bid1 = 6870096000000000000000000;
        uint256 bid2 = 4000000000000000000000000;
        uint256 bid3 = 5326394083803136000000000;

        _startAuctionWithState(QuadKey.createKey(1, 0), bid0, bidder0, 0);
        _mint(QuadKey.createKey(1, 0), bidder0, bidder0, true);

        _startAuctionWithState(QuadKey.createKey(1, 1), bid1, bidder0, 0);
        _mint(QuadKey.createKey(1, 1), bidder0, bidder0, true);

        _startAuctionWithState(QuadKey.createKey(1, 2), bid2, bidder0, 0);
        _mint(QuadKey.createKey(1, 2), bidder0, bidder0, true);

        _startAuctionWithState(QuadKey.createKey(1, 3), bid3, bidder0, 0);
        _mint(QuadKey.createKey(1, 3), bidder0, bidder0, true);

        return true;
    }

    function _restoreStateStep2() private returns (bool) {
        address bidder21_210_211 = address(
            0x916c2Cd2F87c0E9D7a02B76AA8bA6cB6586187D4
        );
        uint256 bid21_210 = 2332800000000000000000000;
        uint256 bid211 = 1166400000000000000000000;

        _startAuctionWithState(
            QuadKey.createKey(2, 9),
            bid21_210,
            bidder21_210_211,
            0
        );
        _mint(
            QuadKey.createKey(2, 9),
            bidder21_210_211,
            bidder21_210_211,
            true
        );

        _startAuctionWithState(
            QuadKey.createKey(3, 36),
            bid21_210,
            bidder21_210_211,
            0
        );
        _mint(
            QuadKey.createKey(3, 36),
            bidder21_210_211,
            bidder21_210_211,
            true
        );

        _startAuctionWithState(
            QuadKey.createKey(3, 37),
            bid211,
            bidder21_210_211,
            0
        );
        _mint(
            QuadKey.createKey(3, 37),
            bidder21_210_211,
            bidder21_210_211,
            true
        );

        return true;
    }

    //current bids
    function _restoreStateStep3() private returns (bool) {
        address bidder13 = address(0xf78845201bf2e074D6D565F7453F15a1F2355BBe);
        uint256 bid13 = 4006640987200000000000000;

        _startAuctionWithState(QuadKey.createKey(2, 7), bid13, bidder13, 0);
        _mint(QuadKey.createKey(2, 7), bidder13, bidder13, true);

        address bidder12 = address(0x043027C0d28a1544AB43b3aaDeba8114Bbaaea54);
        uint256 bid12 = 3709851840000000000000000;

        address bidder2100 = address(
            0x056bF45a910A1713260448Fb35B87109b9B9d80B
        );
        uint256 bid2100 = 1166400000000000000000000;

        address bidder2101 = address(
            0x7ed2920944537A54AB335B8472e5732e08b086C1
        );
        uint256 bid2101 = 1469328076800000000000000;

        address bidder2102 = address(
            0xfe895F027a53f852161f12533B48663Ba4a4c625
        );
        uint256 bid2102 = 1166400000000000000000000;

        address bidder2103 = address(
            0x0D0E4F04d81De844a8E5e2F3C506Ba7e43ffecEf
        );
        uint256 bid2103 = 1166400000000000000000000;

        address bidder31 = address(0x7b385C1a2E3e4f324410Da1B8953F6474D6897ce);
        uint256 bid31 = 2876252805253693440000000;

        _startAuctionWithState(
            QuadKey.createKey(2, 6),
            bid12,
            bidder12,
            _generateAuctionLengthInMinutes(QuadKey.createKey(2, 6)) *
                TimeConstants.SECONDS_IN_MINUTE
        );

        _startAuctionWithState(
            QuadKey.createKey(4, 144),
            bid2100,
            bidder2100,
            _generateAuctionLengthInMinutes(QuadKey.createKey(2, 6)) *
                TimeConstants.SECONDS_IN_MINUTE
        );

        _startAuctionWithState(
            QuadKey.createKey(4, 145),
            bid2101,
            bidder2101,
            1
        );

        _startAuctionWithState(
            QuadKey.createKey(4, 146),
            bid2102,
            bidder2102,
            _generateAuctionLengthInMinutes(QuadKey.createKey(2, 6)) *
                TimeConstants.SECONDS_IN_MINUTE
        );

        _startAuctionWithState(
            QuadKey.createKey(4, 147),
            bid2103,
            bidder2103,
            1
        );

        _startAuctionWithState(
            QuadKey.createKey(2, 13),
            bid31,
            bidder31,
            _generateAuctionLengthInMinutes(QuadKey.createKey(2, 13)) *
                TimeConstants.SECONDS_IN_MINUTE
        );

        //dutch auctions
        _startAuctionWithState(QuadKey.createKey(2, 8), 0, address(0x0), 0);
        _startAuctionWithState(QuadKey.createKey(2, 10), 0, address(0x0), 0);
        _startAuctionWithState(QuadKey.createKey(2, 11), 0, address(0x0), 0);
        _startAuctionWithState(QuadKey.createKey(3, 39), 0, address(0x0), 0);

        return true;
    }

    function _makeAvailable(uint256 id, uint256 initialStartingBid) private {
        _startAuction(
            id,
            initialStartingBid,
            _generateAuctionLengthInMinutes(id) *
                TimeConstants.SECONDS_IN_MINUTE
        );
    }

    function _makeChildrenAvailable(
        uint256 id,
        uint256 initialStartingBid
    ) internal returns (bool) {
        for (uint8 i = 0; i < 4; i++) {
            uint256 childId = QuadKey.child(id, i);
            if (!started(childId)) {
                _makeAvailable(childId, initialStartingBid);
            }
        }
        return true;
    }

    function randomSlotCount() public view override returns (uint8) {
        return uint8(_randomSlots.length);
    }

    function randomSlotOdds(uint256 slot) public view override returns (uint8) {
        return _randomSlots[slot].odds;
    }

    function randomSlotWeight(
        uint256 slot
    ) public view override returns (int16) {
        return _randomSlots[slot].weight;
    }

    function _refundCurrentBid(
        uint256 id,
        uint256 fee
    ) internal returns (uint256) {
        if (hasBid(id)) {
            uint256 refundAmount = _auctions[id].bid + fee;
            currency().safeTransfer(_auctions[id].bidder, refundAmount);
            emit RefundedCurrentBid(_auctions[id].bidder, id, refundAmount);
            _auctions[id].bidder = address(0);
            return fee;
        }
        return 0;
    }

    function _generateAuctionLengthInMinutes(
        uint256 id
    ) internal view returns (uint32) {
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

    function _mintWithFee(
        uint256 id,
        address feeReceiver
    ) private returns (bool) {
        require(started(id), "Auction not Started");

        uint256 price = 0;
        address realFeeReceiver = feeReceiver;
        address winner = bidder(id);

        if (!_canMint(id)) {
            if (this._dutchAuctionActive(id)) {
                price = this._dutchAuctionPrice(id);
            } else {
                require(QuadKey.zoomFromKey(id) > 2, "Buy Now not allowed");
                price = this._mintNowPrice(id);
            }
            _bid(id, price);
            realFeeReceiver = msg.sender;
            winner = msg.sender;
        }
        return _mint(id, winner, realFeeReceiver, true);
    }

    function mint(uint256 id) public override returns (bool) {
        return _mintWithFee(id, bidder(id));
    }

    function canMintForReward(uint256 id) public view override returns (bool) {
        if (!_canMint(id)) {
            return false; //not mintable
        }
        return (endTime(id) <
            (uint32(block.timestamp) -
                (TimeConstants.MINUTES_IN_DAY *
                    TimeConstants.SECONDS_IN_MINUTE))); //ended 24 hours ago?
    }

    function mintForReward(uint256 id) public override returns (bool) {
        require(canMintForReward(id), "Minting for reward not available");
        return _mintWithFee(id, msg.sender);
    }

    function start(
        uint256 initialStartingBid,
        address geotokenZeroOwner
    ) public override returns (bool) {
        require(msg.sender == _owner, "Can only be started by owner");
        _geotokens.safeMint(geotokenZeroOwner, QuadKey.createKey(0, 0));
        _restoreStateStep0();
        emit MinterStarted(msg.sender, initialStartingBid);
        return true;
    }

    function startStep1() public returns (bool) {
        require(msg.sender == _owner, "Can only be started by owner");
        _restoreStateStep1();
        return true;
    }

    function startStep2() public returns (bool) {
        require(msg.sender == _owner, "Can only be started by owner");
        _restoreStateStep2();
        return true;
    }

    function startStep3() public returns (bool) {
        require(msg.sender == _owner, "Can only be started by owner");
        _restoreStateStep3();
        return true;
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

    function _mint(
        uint256 id,
        address winner,
        address feeReceiver,
        bool startChildren
    ) private returns (bool) {
        uint256 amount = currentBid(id);
        if (this._dutchAuctionActive(id)) {
            amount = this._dutchAuctionPrice(id);
        }
        _geotokens.safeMint(winner, id);
        _flowTokens(id, amount, feeReceiver);
        if (startChildren) {
            _makeChildrenAvailable(
                id,
                amount.mulDiv(
                    _childStartingBidPercent,
                    PercentConstants.PERCENT_DIV
                )
            );
        }
        emit GeotokenMinted(msg.sender, id);
        return true;
    }

    function bidFeePercent() public pure override returns (uint8) {
        return 8;
    }

    function bidFee(
        uint256 id,
        uint256 bidAmount
    ) public view override returns (uint256) {
        return this._bidFee(id, bidAmount);
    }

    function minimumBidIncreasePercent() public pure override returns (uint8) {
        return 8;
    }

    function minimumBid(uint256 id) public view override returns (uint256) {
        return this._minimumBid(id);
    }

    function dutchAuctionActive(
        uint256 id
    ) public view override returns (bool) {
        return this._dutchAuctionActive(id);
    }

    function dutchAuctionPrice(
        uint256 id
    ) public view override returns (uint256) {
        return this._dutchAuctionPrice(id);
    }

    function calcDutchAuctionPrice(
        uint256 basePrice,
        uint256 age
    ) public pure override returns (uint256) {
        return DutchAuction._calcDutchAuctionPrice(basePrice, age);
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
