// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../erc20/contracts/Erc20Store.sol";
import "./IUniGenPair.sol";

contract UniGenPair is IUniGenPair, Erc20Store {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    mapping(address => uint256) private _stakeBlock;
    mapping(address => uint256) private _pending;

    //the source ERC20 to be used
    IERC20 private immutable _source;

    //the target ERC20 to be used
    IERC20 private immutable _target;

    uint256 private _pendingTotal;

    //the frequency of which the target token is generated
    uint256 private immutable _frequency;

    //the ratio used when generating the targetToken.  Either N-to-1 or 1-to-N depending on the setting of _fractional
    uint256 private immutable _ratio;

    //if true, then N-to-1 algorithim is used
    bool private immutable _fractional;

    constructor(
        IERC20 sourceToken,
        IERC20 targetToken,
        uint256 frequency,
        uint256 ratio,
        bool fractional
    ) {
        _source = sourceToken;
        _target = targetToken;
        _frequency = frequency;
        _ratio = ratio;
        _fractional = fractional;
        _pendingTotal = 0;
    }

    function source() external view returns (IERC20) {
        return _source;
    }

    function target() external view returns (IERC20) {
        return _target;
    }

    function stake(uint256 amount) external returns (uint256) {
        return _depositErc20(uint256(uint160(msg.sender)), _source, amount);
    }

    function unstake(uint256 amount) external returns (uint256) {
        return _withdrawErc20(uint256(uint160(msg.sender)), _source, amount);
    }

    function unstakeAll() external returns (uint256) {
        return
            _withdrawErc20(
                uint256(uint160(msg.sender)),
                _source,
                _sourceBalance()
            );
    }

    function _deposit(uint256 amount) internal returns (uint256) {
        _target.safeTransferFrom(msg.sender, address(this), amount);
        return amount;
    }

    function deposit(uint256 amount) external returns (uint256) {
        return _deposit(amount);
    }

    function _withdraw(uint256 amount) internal returns (uint256) {
        _target.safeTransfer(msg.sender, amount);
        _pendingTotal = _pendingTotal.sub(amount);
        return amount;
    }

    function withdraw(uint256 amount) external returns (uint256) {
        return _withdraw(amount);
    }

    function withdrawAll() external returns (uint256) {
        return _withdraw(_targetBalance());
    }

    function sourceBalance() external view returns (uint256) {
        return _sourceBalance();
    }

    function _sourceBalance() internal view returns (uint256) {
        return _balanceErc20(uint256(uint160(msg.sender)), _source);
    }

    function targetBalance() external view returns (uint256) {
        return _targetBalance();
    }

    function _targetBalance() internal view returns (uint256) {
        return _balanceErc20(uint256(uint160(msg.sender)), _target);
    }

    function targetBalanceFor(address addr) external view returns (uint256) {
        return _targetBalanceFor(addr);
    }

    function _targetBalanceFor(address addr) internal view returns (uint256) {
        return _balanceErc20(uint256(uint160(addr)), _target);
    }

    function _blocksPassed() internal view returns (uint256) {
        return block.number - _stakeBlock[msg.sender];
    }

    function _generations() internal view returns (uint256) {
        return _blocksPassed().div(_frequency);
    }

    function pendingFor(address addr) external view returns (uint256) {
        return _pending[addr];
    }

    function pending() external view returns (uint256) {
        return _pending[msg.sender];
    }

    function available() external view returns (uint256) {
        return _target.balanceOf(address(this));
    }

    function generate() external returns (uint256) {
        return _generate();
    }

    function _generate() internal returns (uint256) {
        uint256 amount = _calcGeneratedAmount();
        _pending[msg.sender] = amount.add(_pending[msg.sender]);
        _pendingTotal = _pendingTotal.add(amount);
        _stakeBlock[msg.sender] = block.number;
        return amount;
    }

    function _calcGeneratedFractionalAmount() internal view returns (uint256) {
        return _generations().mul(_sourceBalance()).div(_ratio);
    }

    function _calcGeneratedStandardAmount() internal view returns (uint256) {
        return _ratio.mul(_sourceBalance()).mul(_generations());
    }

    function _calcGeneratedAmount() internal view returns (uint256) {
        if (_fractional == true) {
            return _calcGeneratedFractionalAmount();
        }
        return _calcGeneratedStandardAmount();
    }
}
