// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TransferStake {
    address stakingToken;

    constructor(
        address _stakingToken // The token that is used for staking
    ) {
        stakingToken = _stakingToken;
    }

    function _transferStakeFromSender(uint256 amount) internal returns (bool) {
        IERC20(stakingToken).transferFrom(msg.sender, address(this), amount);
        return true;
    }

    function _transferStakeToSender(uint256 amount) internal returns (bool) {
        IERC20(stakingToken).transfer(msg.sender, amount);
        return true;
    }
}
