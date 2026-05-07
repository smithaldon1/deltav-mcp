import { describe, expect, it } from "vitest";
import { OpcUaNodeIdMapper } from "../../src/datasources/opcua/nodeIdMapper.js";

describe("OpcUaNodeIdMapper", () => {
  it("loads and resolves the checked-in node map", async () => {
    const mapper = await OpcUaNodeIdMapper.fromFile("config/opcua-node-map.json");
    const entry = mapper.resolveNodeId("TIC_301/PV.CV");
    expect(entry.nodeId).toContain("TIC_301/PV.CV");
    expect(entry.area).toBe("AREA_B");
  });

  it("searches logical IDs and metadata", async () => {
    const mapper = await OpcUaNodeIdMapper.fromFile("config/opcua-node-map.json");
    const results = mapper.search("pump", undefined, 10);
    expect(results.some((entry) => entry.logicalId === "PUMP_101/RUN_ST.CV")).toBe(true);
  });
});
