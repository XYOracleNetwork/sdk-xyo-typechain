// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AbstractTransferStake} from "./Abstract.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TransferStake is AbstractTransferStake {
    using SafeERC20 for IERC20;
    address private __stakingTokenAddress;

    constructor(
        address _stakingTokenAddress // The token that is used for staking
    ) {
        __stakingTokenAddress = _stakingTokenAddress;
    }

    function stakingTokenAddress() public view override returns (address) {
        return __stakingTokenAddress;
    }

    function _transferStakeFromSender(
        uint256 amount
    ) internal override returns (bool) {
        IERC20(__stakingTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        emit StakeIn(msg.sender, amount);
        return true;
    }

    function _transferStakeToSender(
        uint256 amount
    ) internal override returns (bool) {
        IERC20(__stakingTokenAddress).transfer(msg.sender, amount);
        emit StakeOut(msg.sender, amount);
        return true;
    }

    function _burnStake(
        address _address,
        uint256 amount
    ) internal override returns (bool) {
        IERC20(__stakingTokenAddress).transfer(address(0), amount);
        emit StakeBurned(_address, amount);
        return true;
    }
}
