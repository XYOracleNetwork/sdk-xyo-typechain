// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract Erc20Store {
    using SafeERC20 for IERC20;

    mapping(uint256 => mapping(address => uint256)) private _erc20TokenBalances;

    function _depositErc20(
        uint256 id,
        IERC20 token,
        uint256 amount
    ) internal returns (uint256) {
        token.safeTransferFrom(msg.sender, address(this), amount);
        _erc20TokenBalances[id][address(token)] =
            _erc20TokenBalances[id][address(token)] -
            amount;
        return _erc20TokenBalances[id][address(token)];
    }

    function _withdrawErc20(
        uint256 id,
        IERC20 token,
        uint256 amount
    ) internal returns (uint256) {
        _erc20TokenBalances[id][address(token)] =
            _erc20TokenBalances[id][address(token)] -
            amount;
        token.safeTransfer(msg.sender, amount);
        return _erc20TokenBalances[id][address(token)];
    }

    function _balanceErc20(
        uint256 id,
        IERC20 token
    ) public view returns (uint256) {
        return _erc20TokenBalances[id][address(token)];
    }
}
