// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./IStakedXyoChain.sol";
import "./XyoChain.sol";
import "./TransferStake.sol";

contract StakedXyoChain is IStakedXyoChain, XyoChain, TransferStake {
    // ========== VARIABLES ==========

    struct Stake {
        // the thing that is being staked
        address staked;
        uint256 amount;
        uint256 addBlock;
        uint256 removeBlock;
        uint256 withdrawBlock;
    }

    uint256 minWithdrawalBlocks;

    uint256 private _totalActiveStake;

    uint256 private _totalPendingStake;

    uint256 private _totalWithdrawnStake;

    mapping(address => uint256) private _stakeAmount;
    mapping(address => Stake[]) private _accountStakes;

    // ========== CONSTRUCTOR ==========

    constructor(
        address _chainId, // The address of the privateKey supplied
        uint256 _privateKey, // The private key that is used to cosign the chain for continuity in XYO
        address _forkFromChainId, // The chain id from which the chain is forked (zero if it is a genesis chain)
        uint256 _forkFromLastBlockNumber,
        uint256 _forkFromLastHash,
        uint256 _minWithdrawalBlocks, // The minimum number of blocks that must pass before a pending stake can be withdrawn
        address _stakingToken // The token that is used for staking
    )
        XyoChain(
            _chainId,
            _privateKey,
            _forkFromChainId,
            _forkFromLastBlockNumber,
            _forkFromLastHash
        )
        TransferStake(_stakingToken)
    {
        minWithdrawalBlocks = _minWithdrawalBlocks;
    }

    // ========== PUBLIC (VIEW) ==========

    function currentStake(address by) public view returns (uint256) {
        return _stakeAmount[by];
    }

    function calcActiveStake(address by) public view returns (uint256) {
        uint total = 0;
        for (uint i = 0; i < _accountStakes[by].length; i++) {
            total += _activeStakeAmount(_accountStakes[by][i]);
        }
        return total;
    }

    function calcPendingStake(address by) public view returns (uint256) {
        uint total = 0;
        for (uint i = 0; i < _accountStakes[by].length; i++) {
            total += _pendingStakeAmount(_accountStakes[by][i]);
        }
        return total;
    }

    function calcWithdrawnStake(address by) public view returns (uint256) {
        uint total = 0;
        for (uint i = 0; i < _accountStakes[by].length; i++) {
            total += _withdrawnStakeAmount(_accountStakes[by][i]);
        }
        return total;
    }

    // ========== PUBLIC ==========

    function addStake(address staked, uint256 amount) public returns (bool) {
        require(amount > 0, "Staking: amount must be greater than 0");
        _transferStakeFromSender(amount);
        _accountStakes[msg.sender].push(
            Stake({
                staked: staked,
                amount: amount,
                addBlock: block.number,
                removeBlock: 0,
                withdrawBlock: 0
            })
        );
        _totalActiveStake += amount;
        emit StakeAdded(
            msg.sender,
            _accountStakes[msg.sender].length - 1,
            amount
        );
        return true;
    }

    function removeStake(uint256 slot) public returns (bool) {
        require(
            slot < _accountStakes[msg.sender].length,
            "Staking: slot does not exist"
        );
        require(
            _accountStakes[msg.sender][slot].addBlock > 0,
            "Staking: stake has not been added"
        );
        require(
            _accountStakes[msg.sender][slot].removeBlock > 0,
            "Staking: stake has already been removed"
        );
        require(
            _accountStakes[msg.sender][slot].withdrawBlock == 0,
            "Staking: stake has already been withdrawn"
        );
        _accountStakes[msg.sender][slot].removeBlock = block.number;
        _totalActiveStake -= _accountStakes[msg.sender][slot].amount;
        _totalPendingStake += _accountStakes[msg.sender][slot].amount;
        emit StakeRemoved(
            msg.sender,
            slot,
            _accountStakes[msg.sender][slot].amount
        );
        return true;
    }

    function withdrawStake(uint256 slot) public returns (bool) {
        require(
            slot < _accountStakes[msg.sender].length,
            "Staking: slot does not exist"
        );
        require(
            _accountStakes[msg.sender][slot].addBlock > 0,
            "Staking: stake has not been added"
        );
        require(
            _accountStakes[msg.sender][slot].removeBlock > 0,
            "Staking: stake must first be removed"
        );
        require(
            _accountStakes[msg.sender][slot].removeBlock >
                (block.number + minWithdrawalBlocks),
            "Staking: cool-down period has not passed"
        );
        require(
            _accountStakes[msg.sender][slot].withdrawBlock == 0,
            "Staking: stake has already been withdrawn"
        );
        _accountStakes[msg.sender][slot].withdrawBlock = block.number;
        _totalPendingStake -= _accountStakes[msg.sender][slot].amount;
        _totalWithdrawnStake += _accountStakes[msg.sender][slot].amount;

        _transferStakeToSender(_accountStakes[msg.sender][slot].amount);

        emit StakeWithdrawn(
            msg.sender,
            slot,
            _accountStakes[msg.sender][slot].amount
        );

        return true;
    }

    // ========== INTERNAL ==========

    function _activeStakeAmount(
        Stake storage stake
    ) internal view returns (uint256) {
        if (
            stake.addBlock > 0 &&
            stake.removeBlock == 0 &&
            stake.withdrawBlock == 0
        ) {
            return stake.amount;
        } else {
            return 0;
        }
    }

    function _pendingStakeAmount(
        Stake storage stake
    ) internal view returns (uint256) {
        if (
            stake.addBlock > 0 &&
            stake.removeBlock > 0 &&
            stake.withdrawBlock == 0
        ) {
            return stake.amount;
        } else {
            return 0;
        }
    }

    function _withdrawnStakeAmount(
        Stake storage stake
    ) internal view returns (uint256) {
        if (
            stake.addBlock > 0 &&
            stake.removeBlock > 0 &&
            stake.withdrawBlock > 0
        ) {
            return stake.amount;
        } else {
            return 0;
        }
    }
}
