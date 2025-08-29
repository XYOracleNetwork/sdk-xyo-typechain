// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

interface IAddressStakingProperties {
    // ============ Static ============
    function minWithdrawalBlocks() external view returns (uint256);

    // ============ Volatile [Overall] ============
    function active() external view returns (uint256);

    function pending() external view returns (uint256);

    function withdrawn() external view returns (uint256);

    // ============ Volatile [By Staker] ============
    function activeByStaker(address staker) external view returns (uint256);

    function pendingByStaker(address staker) external view returns (uint256);

    function withdrawnByStaker(address staker) external view returns (uint256);

    // ============ Volatile [By Address Staked] ============
    function activeByAddressStaked(
        address staked
    ) external view returns (uint256);
}
