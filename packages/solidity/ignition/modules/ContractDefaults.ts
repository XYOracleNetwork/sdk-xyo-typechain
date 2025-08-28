export const DEFAULT_MAX_SUPPLY = 1_000_000n * 10n ** 18n // 1,000,000 XYO
export const DEFAULT_MIN_WITHDRAWAL_BLOCKS = 3
export const DEFAULT_NETWORK_STAKING_ADDRESS = '0x1969196919691969196919691969196919691969'
export const DEFAULT_STAKING_REWARD_BPS = 10

export const DEFAULT_XYO_REWARD_CONFIG = {
  initialReward: 1000n,
  stepSize: 100n,
  stepFactorNumerator: 9n,
  stepFactorDenominator: 10n,
  minRewardPerBlock: 100n,
  genesisReward: 5000n,
  floorPlaces: 1n,
}
