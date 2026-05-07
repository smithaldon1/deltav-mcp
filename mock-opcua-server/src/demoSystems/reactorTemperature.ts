import type { Namespace, UAObject } from "node-opcua";
import { addBooleanVariable, addDoubleVariable, addFolderPath, addStringVariable } from "../addressSpace.js";
import { chatteringAlarm } from "../scenarios/chatteringAlarm.js";
import { reactorTemperature } from "../scenarios/highTemperature.js";

export function installReactorTemperature(namespace: Namespace, root: UAObject): void {
  const folder = addFolderPath(namespace, root, ["DemoDeltaV", "AREA_B", "REACTOR_01", "TIC_301"]);
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_B/REACTOR_01/TIC_301/PV.CV", "PV.CV", () => reactorTemperature(Date.now()));
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_B/REACTOR_01/TIC_301/SP.CV", "SP.CV", () => 165);
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_B/REACTOR_01/TIC_301/OUT.CV", "OUT.CV", () => 42 + Math.sin(Date.now() / 3000) * 8);
  addBooleanVariable(namespace, folder, "ns=1;s=AREA_B/REACTOR_01/TIC_301/ALM_HI.ACTIVE", "ALM_HI.ACTIVE", () => reactorTemperature(Date.now()) > 180);
  addBooleanVariable(namespace, folder, "ns=1;s=AREA_B/REACTOR_01/TIC_301/ALM_CHATTER.ACTIVE", "ALM_CHATTER.ACTIVE", () => chatteringAlarm(Date.now()));
  addStringVariable(namespace, folder, "ns=1;s=AREA_B/REACTOR_01/TIC_301/MODE.ACTUAL", "MODE.ACTUAL", () => "CAS");
}
