// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Module that allows an owner to permanently retire a contract.
/// Similar to OpenZeppelin's Pausable, but irreversible.
abstract contract Retirable is Ownable {
    /// @dev Indicates if the contract has been retired
    bool private _retired;

    /// @notice Emitted when the contract is retired
    /// @param retirer Address that retired the contract
    event Retired(address retirer);

    error ContractRetired();

    /// @notice Returns true if the contract has been retired
    function retired() public view returns (bool) {
        return _retired;
    }

    /// @notice Modifier to make a function callable only if not retired
    modifier whenNotRetired() {
        if (_retired) revert ContractRetired();
        _;
    }

    /// @dev Retire the contract. Calls `_retire(payout)` hook for child contracts.
    function retire() public whenNotRetired onlyOwner {
        // Mark as retired
        _retired = true;
        // call the internal method
        _retire();
        // Emit the event
        emit Retired(msg.sender);
    }

    /// @dev Hook for inheriting contracts to implement cleanup/asset transfer.
    function _retire() internal virtual;
}
