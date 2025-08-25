// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ITransferStake} from "./ITransferStake.sol";

abstract contract AbstractTransferStake is ITransferStake {
    function stakingTokenAddress() public view virtual returns (address);

    function _transferStakeFromSender(
        uint256 amount
    ) internal virtual returns (bool);

    function _transferStakeToSender(
        uint256 amount
    ) internal virtual returns (bool);

    function _burnStake(
        address _address,
        uint256 amount
    ) internal virtual returns (bool);
}
