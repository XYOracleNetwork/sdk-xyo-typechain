// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {ITransferStake} from "./TransferStakeV2/ITransferStake.sol";
import {IAddressStaking} from "./AddressStakingV2/interfaces/IAddressStaking.sol";
import {IXyoChain} from "./XyoChain/IXyoChain.sol";

interface IStakedXyoChain is ITransferStake, IAddressStaking, IXyoChain {}
