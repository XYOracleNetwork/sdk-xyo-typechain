// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IErc20Store {
    function depositErc20(
        uint256 id,
        IERC20 token,
        uint256 amount
    ) external returns (uint256);

    function withdrawErc20(
        uint256 id,
        IERC20 token,
        uint256 amount
    ) external returns (uint256);

    function balanceErc20(uint256 id, IERC20 token)
        external
        view
        returns (uint256);
}
