/* eslint-disable import/no-internal-modules */
export * from './dist/types'
export * from './dist/types/common'

import {
  AuctionStartedEvent,
  BidPlacedEvent,
  GeotokenMintedEvent,
  MinterStartedEvent,
  MintingFeeSentEvent,
  RefundedCurrentBidEvent,
  TokensBurnedEvent,
  TokensFlowedEvent,
} from './dist/types/IXyoWorldMinter.d'

export namespace XyoWorldMinterEvents {
  export type AuctionStarted = AuctionStartedEvent
  export type BidPlaced = BidPlacedEvent
  export type GeotokenMinted = GeotokenMintedEvent
  export type MinterStarted = MinterStartedEvent
  export type MintingFeeSent = MintingFeeSentEvent
  export type RefundedCurrentBid = RefundedCurrentBidEvent
  export type TokensBurned = TokensBurnedEvent
  export type TokensFlowed = TokensFlowedEvent
}

import {
  ApprovalEvent,
  ApprovalForAllEvent,
  DataSetEvent,
  Erc20DepositedEvent,
  Erc20WithdrewEvent,
  Erc721DepositedEvent,
  Erc721WithdrewEvent,
  MintedEvent,
  MinterSetEvent,
  SafeMintedEvent,
  TransferEvent,
} from './dist/types/IXyoWorldGeotokens.d'

export namespace XyoWorldGeotokensEvents {
  export type Approval = ApprovalEvent
  export type ApprovalForAll = ApprovalForAllEvent
  export type DataSet = DataSetEvent
  export type Erc20Deposited = Erc20DepositedEvent
  export type Erc20Withdrew = Erc20WithdrewEvent
  export type Erc721Deposited = Erc721DepositedEvent
  export type Erc721Withdrew = Erc721WithdrewEvent
  export type Minted = MintedEvent
  export type MinterSet = MinterSetEvent
  export type SafeMinted = SafeMintedEvent
  export type Transfer = TransferEvent
}
