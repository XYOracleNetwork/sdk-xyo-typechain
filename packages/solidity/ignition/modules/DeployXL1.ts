import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export const SingleAddressSubGovernorModule = (
  name: string,
  votingDelay: number,
  votingPeriod: number
) =>
  buildModule("SingleAddressSubGovernor", (m) => {
    const subGovernor = m.contract("SingleAddressSubGovernor", [
      name,
      votingDelay,
      votingPeriod,
    ]);

    return { subGovernor };
  });

export default buildModule('DeployXL1', (m) => {
  const { subGovernor } = m.useModule(SingleAddressSubGovernorModule("Name", 1, 1))
  return { subGovernor }
})
