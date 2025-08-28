import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SingleAddressSubGovernorModule", (m) => {
  const name = m.getParameter("name", "SingleAddressSubGovernor");
  const votingDelay = m.getParameter("votingDelay", 1);
  const votingPeriod = m.getParameter("votingPeriod", 5);

  const subGovernor = m.contract("SingleAddressSubGovernor", [name, votingDelay, votingPeriod]);

  return { subGovernor };
});