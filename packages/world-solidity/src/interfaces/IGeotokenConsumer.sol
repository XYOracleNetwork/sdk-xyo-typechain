// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./chains/IGeotokenErc721.sol";

interface IGeotokenConsumer {
    function geotokens() external view returns (IGeotokenErc721);
}
