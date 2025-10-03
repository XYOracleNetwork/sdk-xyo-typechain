// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice Module that allows an owner to permanently retire a contract.
/// Similar to OpenZeppelin's Pausable, but irreversible.
abstract contract Retirable is Ownable, Pausable {
    /// @dev Indicates if the contract has been retired
    bool private _retired;
    /// @notice Address that will receive any remaining assets upon retirement
    address public immutable retirementPayout;

    /// @notice Emitted when the contract is retired
    /// @param payout Address that received any final asset payouts
    /// @param balance Balance transferred during retirement
    event Retired(address payout, uint256 balance);

    error AlreadyRetired();

    /// @notice Constructor for the Retirable contract
    /// @param payout_ Address that will receive any remaining assets upon retirement
    constructor(address payout_) {
        retirementPayout = payout_;
    }

    /// @notice Returns true if the contract has been retired
    function retired() public view returns (bool) {
        return _retired;
    }

    /// @notice Modifier to make a function callable only if not retired
    modifier whenNotRetired() {
        require(!_retired, "Retired: contract is retired");
        _;
    }

    /// @dev Retire the contract. Calls `_retire(payout)` hook for child contracts.
    function retire() public onlyOwner {
        if (_retired) revert AlreadyRetired();

        _pause();
        _retired = true;

        uint256 balance = _retire(retirementPayout);

        emit Retired(retirementPayout, balance);
    }

    /// @dev Hook for inheriting contracts to implement cleanup/asset transfer.
    /// Should return how much balance was transferred.
    function _retire(address payout) internal virtual returns (uint256);
}
