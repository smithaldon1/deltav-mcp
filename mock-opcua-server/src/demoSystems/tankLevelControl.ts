import type { Namespace, UAObject } from "node-opcua";
import { addDoubleVariable, addFolderPath, addStringVariable } from "../addressSpace.js";

export function installTankLevelControl(namespace: Namespace, root: UAObject): void {
  const folder = addFolderPath(namespace, root, ["DemoDeltaV", "AREA_A", "TANK_FARM", "LIC_201"]);
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_A/TANK_FARM/LIC_201/PV.CV", "PV.CV", () => 52 + Math.sin(Date.now() / 9000) * 11);
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_A/TANK_FARM/LIC_201/SP.CV", "SP.CV", () => 55);
  addDoubleVariable(namespace, folder, "ns=1;s=AREA_A/TANK_FARM/LIC_201/OUT.CV", "OUT.CV", () => 37 + Math.sin(Date.now() / 7000) * 6);
  addStringVariable(namespace, folder, "ns=1;s=AREA_A/TANK_FARM/LIC_201/MODE.ACTUAL", "MODE.ACTUAL", () => "AUTO");
}
