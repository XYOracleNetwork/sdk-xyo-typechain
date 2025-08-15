// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BridgeableToken is ERC20, Ownable {
    event BridgeInitiated(
        uint256 indexed id,
        address indexed from,
        address indexed destination,
        uint256 amount
    );

    struct BridgeBurn {
        address from;
        address destination;
        uint256 amount;
        uint256 timepoint;
    }

    uint256 public nextBridgeId; // starts at 0
    mapping(uint256 => BridgeBurn) public bridges; // id => record

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC20(name_, symbol_) Ownable(initialOwner) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burns tokens from the owner and records a bridge intent with a unique id.
    function bridge(
        uint256 amount,
        address destination
    ) external onlyOwner returns (uint256 id) {
        _burn(_msgSender(), amount);

        id = nextBridgeId++;
        bridges[id] = BridgeBurn({
            from: _msgSender(),
            destination: destination,
            amount: amount,
            timepoint: block.number
        });

        emit BridgeInitiated(id, _msgSender(), destination, amount);
    }
}
