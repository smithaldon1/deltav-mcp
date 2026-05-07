import { describe, expect, it } from "vitest";
import { registerOpcUaTools } from "../../src/tools/opcuaTools.js";
import { buildOpcUaToolContext, startMockOpcUaFixture } from "../helpers/opcuaServer.js";
import { createToolCapture } from "../helpers/toolRegistry.js";

describe("OPC UA MCP tools", () => {
  it("registers the dedicated OPC UA tool family and executes representative handlers", async () => {
    const { endpointUrl } = await startMockOpcUaFixture();
    const capture = createToolCapture();
    registerOpcUaTools(capture.register, buildOpcUaToolContext(endpointUrl));

    const discover = await capture.get("opcua_discover_endpoints").handler({});
    expect((discover as { endpoints: readonly unknown[] }).endpoints.length).toBeGreaterThan(0);

    const namespaceArray = await capture.get("opcua_get_namespace_array").handler({});
    expect((namespaceArray as { namespaces: readonly string[] }).namespaces.length).toBeGreaterThan(1);

    const browse = await capture.get("opcua_browse_node").handler({
      nodeId: "ns=1;s=DemoDeltaV/AREA_B/REACTOR_01/TIC_301",
    });
    expect((browse as { references: readonly { browseName: string }[] }).references.length).toBeGreaterThan(0);

    const read = await capture.get("opcua_read_node").handler({
      logicalId: "TIC_301/PV.CV",
      nodeId: "TIC_301/PV.CV",
    });
    expect((read as { nodeId: string }).nodeId).toContain("TIC_301/PV.CV");

    const sampled = await capture.get("opcua_sample_nodes_for_window").handler({
      nodeIds: ["ns=1;s=AREA_B/REACTOR_01/TIC_301/PV.CV"],
      startTime: new Date(Date.now() - 1000).toISOString(),
      endTime: new Date().toISOString(),
      maxPoints: 3,
    });
    expect((sampled as { samples: readonly unknown[] }).samples.length).toBeGreaterThan(0);
  });
});
