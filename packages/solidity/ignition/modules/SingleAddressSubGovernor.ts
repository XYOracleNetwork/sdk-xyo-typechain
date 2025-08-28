import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

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