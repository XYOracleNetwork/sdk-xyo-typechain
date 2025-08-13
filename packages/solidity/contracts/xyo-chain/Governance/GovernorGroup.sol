// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {IGovernor, Governor} from "@openzeppelin/contracts/governance/Governor.sol";

abstract contract GovernorGroup is Governor {
    IGovernor[] __governors; // The governance branches that are allowed to govern the contract
    mapping(IGovernor => bool) public isGovernor;

    modifier onlyThis() {
        require(
            msg.sender == address(this),
            "GovernorGroup: caller is not the contract itself"
        );
        _;
    }

    // ========== CONSTRUCTOR ==========

    constructor(
        IGovernor[] memory _governors // The addresses that are allowed to govern the contract
    ) {
        __governors = _governors;
        for (uint256 i = 0; i < _governors.length; i++) {
            isGovernor[__governors[i]] = true;
        }
    }

    function addGovernor(IGovernor governor) public onlyThis {
        bool isPreviousGovernor = false;
        for (uint256 i = 0; i < __governors.length; i++) {
            if (isGovernor[__governors[i]]) {
                isPreviousGovernor = true;
                break;
            }
        }
        if (!isPreviousGovernor) {
            __governors.push(governor);
        }
        isGovernor[governor] = true;
    }

    function removeGovernor(IGovernor governor) public onlyThis {
        if (isGovernor[governor]) {
            isGovernor[governor] = false;
        }
    }

    // ========== PUBLIC ==========

    /**
     * @dev Returns the governors that have approval authority
     */
    function governors() public view returns (IGovernor[] memory) {
        // First, count the active governors
        uint256 activeCount = 0;
        for (uint256 i = 0; i < __governors.length; i++) {
            if (isGovernor[__governors[i]]) {
                activeCount++;
            }
        }

        // Create a properly sized array
        IGovernor[] memory result = new IGovernor[](activeCount);

        // Fill the array with active governors
        uint256 resultIndex = 0;
        for (uint256 i = 0; i < __governors.length; i++) {
            if (isGovernor[__governors[i]]) {
                result[resultIndex] = __governors[i];
                resultIndex++;
            }
        }

        return result;
    }
}
