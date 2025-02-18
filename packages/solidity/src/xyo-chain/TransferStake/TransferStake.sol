// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Abstract.sol";

contract TransferStake is AbstractTransferStake {
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
        IERC20(__stakingTokenAddress).transferFrom(
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
}
