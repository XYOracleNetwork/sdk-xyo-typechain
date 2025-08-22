// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @dev Abstract contract that allows multiple governance branches to govern the same contract.
 * Each governor contract must implement the IGovernor interface.
 */

abstract contract GovernorGroup is Governor {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet internal __governors;

    modifier onlyThis() {
        require(
            msg.sender == address(this),
            "GovernorGroup: caller is not the contract itself"
        );
        _;
    }

    // ========== CONSTRUCTOR ==========

    constructor(
        string memory _name,
        address[] memory _governors // The addresses that are allowed to govern the contract
    ) Governor(_name) {
        for (uint256 i = 0; i < _governors.length; i++) {
            __governors.add(_governors[i]);
        }
    }

    function addGovernor(address governor) public onlyThis {
        if (!isGovernor(governor)) {
            __governors.add(governor);
        }
    }

    function removeGovernor(address governor) public onlyThis {
        if (isGovernor(governor)) {
            __governors.remove(governor);
        }
    }

    function isGovernor(address governor) public view returns (bool) {
        return __governors.contains(governor);
    }

    // ========== PUBLIC ==========

    /**
     * @dev Returns the governors that have approval authority
     */
    function governors() public view returns (address[] memory) {
        return __governors.values();
    }

    function governorCount() public view returns (uint256) {
        return __governors.length();
    }
}
