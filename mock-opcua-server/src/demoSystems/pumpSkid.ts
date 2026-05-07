import type { Namespace, UAObject } from "node-opcua";
import { addBooleanVariable, addDoubleVariable, addFolderPath, addStringVariable } from "../addressSpace.js";
import { motorTripSignal } from "../scenarios/motorTrip.js";

export function installPumpSkid(namespace: Namespace, root: UAObject): void {
  const folder = addFolderPath(namespace, root, ["DemoDeltaV", "AREA_A", "UNIT_100", "PUMP_101"]);
  addBooleanVariable(namespace, folder, "ns=1;s=AREA_A/UNIT_100/PUMP_101/RUN_ST.CV", "RUN_ST.CV", () => {
    const signal = motorTripSignal(Date.now());
    return signal.running;
  });
  addBooleanVariable(namespace, folder, "ns=1;s=AREA_A/UNIT_100/PUMP_101/FAULT.CV", "FAULT.CV", () => {
    const signal = motorTripSignal(Date.now());
    return signal.fault;
  });
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_A/UNIT_100/PUMP_101/FLOW.PV", "FLOW.PV", () => {
    const signal = motorTripSignal(Date.now());
    return signal.running ? 115 + Math.sin(Date.now() / 4000) * 4 : 0;
  });
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_A/UNIT_100/PUMP_101/AMPS.PV", "AMPS.PV", () => {
    const signal = motorTripSignal(Date.now());
    return signal.running ? 18 + Math.sin(Date.now() / 5000) : 2;
  });
  addStringVariable(namespace, folder, "ns=1;s=AREA_A/UNIT_100/PUMP_101/MODE.ACTUAL", "MODE.ACTUAL", () => "AUTO");
}
