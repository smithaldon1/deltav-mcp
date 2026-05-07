import { describe, expect, it } from "vitest";
import { createDataSourceAdapter } from "../../src/datasources/dataSourceFactory.js";
import { buildOpcUaConfig, startMockOpcUaFixture } from "../helpers/opcuaServer.js";

describe("mock OPC UA server integration", () => {
  it("supports endpoint discovery, namespace reads, browse, reads, and monitoring", async () => {
    const { endpointUrl } = await startMockOpcUaFixture();
    const adapter = createDataSourceAdapter(buildOpcUaConfig(endpointUrl));
    expect(adapter.kind).toBe("OPCUA");
    const opcua = adapter as never as {
      getClient(): {
        discoverEndpoints(): Promise<readonly { endpointUrl: string }[]>;
        getNamespaceArray(): Promise<readonly string[]>;
        browseNode(nodeId: string): Promise<{ references: readonly { browseName: string }[] }>;
        readMappedValue(identifier: string): Promise<{ nodeId: string }>;
        readMappedValues(identifiers: readonly string[]): Promise<readonly { nodeId: string }[]>;
        translatePath(startingNodeId: string, browsePath: string): Promise<{ targets: readonly string[] }>;
        sampleNodesForWindow(
          nodeIds: readonly string[],
          start: Date,
          end: Date,
          maxPoints: number,
        ): Promise<readonly unknown[]>;
        monitorNodesForWindow(
          nodeIds: readonly string[],
          durationMs: number,
          samplingIntervalMs: number,
        ): Promise<readonly unknown[]>;
      };
    };

    const endpoints = await opcua.getClient().discoverEndpoints();
    expect(endpoints.length).toBeGreaterThan(0);

    const namespaces = await opcua.getClient().getNamespaceArray();
    expect(namespaces.length).toBeGreaterThan(1);

    const browse = await opcua.getClient().browseNode("ns=1;s=DemoDeltaV/AREA_B/REACTOR_01/TIC_301");
    expect(browse.references.some((reference) => reference.browseName.includes("PV.CV"))).toBe(true);

    const read = await opcua.getClient().readMappedValue("TIC_301/PV.CV");
    expect(read.nodeId).toContain("TIC_301/PV.CV");

    const multiRead = await opcua.getClient().readMappedValues(["TIC_301/PV.CV", "TIC_301/SP.CV"]);
    expect(multiRead).toHaveLength(2);

    const translated = await opcua.getClient().translatePath("RootFolder", "/Objects/Server");
    expect(translated.targets.length).toBeGreaterThan(0);

    const samples = await opcua.getClient().sampleNodesForWindow(
      ["ns=1;s=AREA_B/REACTOR_01/TIC_301/PV.CV"],
      new Date(Date.now() - 2000),
      new Date(),
      4,
    );
    expect(samples.length).toBeGreaterThan(0);

    const events = await opcua.getClient().monitorNodesForWindow(
      ["ns=1;s=AREA_B/REACTOR_01/TIC_301/PV.CV"],
      1200,
      250,
    );
    expect(events.length).toBeGreaterThan(0);
  });
});
