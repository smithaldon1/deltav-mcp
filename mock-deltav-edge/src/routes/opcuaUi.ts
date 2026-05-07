import type { ServerResponse } from "node:http";
import type { MockConfig } from "../config.js";

const presets = [
  {
    label: "Reactor Temperature PV",
    logicalId: "TIC_301/PV.CV",
    nodeId: "ns=1;s=AREA_B/REACTOR_01/TIC_301/PV.CV",
    area: "AREA_B",
    browseNodeId: "ns=1;s=DemoDeltaV/AREA_B/REACTOR_01/TIC_301",
    browsePath: "/Objects/DemoDeltaV/AREA_B/REACTOR_01/TIC_301",
    description: "Primary reactor temperature process variable.",
  },
  {
    label: "Reactor Output",
    logicalId: "TIC_301/OUT.CV",
    nodeId: "ns=1;s=AREA_B/REACTOR_01/TIC_301/OUT.CV",
    area: "AREA_B",
    browseNodeId: "ns=1;s=DemoDeltaV/AREA_B/REACTOR_01/TIC_301",
    browsePath: "/Objects/DemoDeltaV/AREA_B/REACTOR_01/TIC_301",
    description: "Controller output used for sampled and monitored trends.",
  },
  {
    label: "Pump Run Status",
    logicalId: "PUMP_101/RUN_ST.CV",
    nodeId: "ns=1;s=AREA_A/UNIT_100/PUMP_101/RUN_ST.CV",
    area: "AREA_A",
    browseNodeId: "ns=1;s=DemoDeltaV/AREA_A/UNIT_100/PUMP_101",
    browsePath: "/Objects/DemoDeltaV/AREA_A/UNIT_100/PUMP_101",
    description: "Motor run-state boolean for trip/restart review.",
  },
  {
    label: "Pump Fault Status",
    logicalId: "PUMP_101/FAULT.CV",
    nodeId: "ns=1;s=AREA_A/UNIT_100/PUMP_101/FAULT.CV",
    area: "AREA_A",
    browseNodeId: "ns=1;s=DemoDeltaV/AREA_A/UNIT_100/PUMP_101",
    browsePath: "/Objects/DemoDeltaV/AREA_A/UNIT_100/PUMP_101",
    description: "Trip/fault indicator for motor and nuisance alarm scenarios.",
  },
];

export function handleOpcUaPresets(config: MockConfig, res: ServerResponse): void {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      endpoint: config.mockOpcUaEndpoint,
      presets,
      monitoredSampleSuggestion: {
        durationMs: 4000,
        samplingIntervalMs: 500,
      },
    }),
  );
}
