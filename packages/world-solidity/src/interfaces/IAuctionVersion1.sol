// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./chains/IBurnableErc20.sol";
import "./chains/IMintableErc721.sol";

interface IAuctionVersion1 {
    function bidder(uint256 id) external view returns (address);

    function currentBid(uint256 id) external view returns (uint256);

    function startingBid(uint256 id) external view returns (uint256);

    function startTime(uint256 id) external view returns (uint256);

    function endTime(uint256 id) external view returns (uint256);

    function started(uint256 id) external view returns (bool);

    function expired(uint256 id) external view returns (bool);

    function hasBid(uint256 id) external view returns (bool);

    function hasMinted(uint256 id) external view returns (bool);

    function currency() external view returns (IBurnableErc20);

    function tokens() external view returns (IMintableErc721);

    function bid(uint256 id, uint256 bidAmount) external returns (bool);

    function mint(uint256 id) external returns (bool);

    function start(uint256 initialStartingBid, address geotokenZeroOwner)
        external
        returns (bool);
}
