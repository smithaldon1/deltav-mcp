import type { Namespace, UAObject } from "node-opcua";
import { addBooleanVariable, addDoubleVariable, addFolderPath, addStringVariable } from "../addressSpace.js";

export function installCipSkid(namespace: Namespace, root: UAObject): void {
  const folder = addFolderPath(namespace, root, ["DemoDeltaV", "AREA_C", "CIP_01", "PHASE_20"]);
  addStringVariable(namespace, folder, "ns=1;s=AREA_C/CIP_01/PHASE_20/STATE.ACTUAL", "STATE.ACTUAL", () => {
    const phase = Math.floor(Date.now() / 15000) % 4;
    return ["IDLE", "FILL", "WASH", "RINSE"][phase] ?? "IDLE";
  });
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_C/CIP_01/PHASE_20/TEMP.PV", "TEMP.PV", () => 68 + Math.sin(Date.now() / 5000) * 3);
  addBooleanVariable(namespace, folder, "ns=1;s=AREA_C/CIP_01/PHASE_20/HOLD.ACTIVE", "HOLD.ACTIVE", () => Math.floor(Date.now() / 45000) % 5 === 4);
}
