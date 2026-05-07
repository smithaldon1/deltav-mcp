import type { Namespace, UAObject } from "node-opcua";
import { addDoubleVariable, addFolderPath } from "../addressSpace.js";

export function installUtilityHeader(namespace: Namespace, root: UAObject): void {
  const folder = addFolderPath(namespace, root, ["DemoDeltaV", "UTILITIES", "HEADER_01"]);
  addDoubleVariable(namespace, folder, "ns=1;s=UTILITIES/HEADER_01/PRESSURE.PV", "PRESSURE.PV", () => 84 + Math.sin(Date.now() / 6000) * 1.5);
  addDoubleVariable(namespace, folder, "ns=1;s=UTILITIES/HEADER_01/FLOW.PV", "FLOW.PV", () => 310 + Math.sin(Date.now() / 8000) * 12);
}
