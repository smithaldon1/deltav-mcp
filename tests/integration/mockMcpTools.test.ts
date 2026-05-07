import { describe, expect, it } from "vitest";
import { registerBatchTools } from "../../src/tools/batchTools.js";
import { registerDeltavAuthStatusTool } from "../../src/tools/deltavAuthStatus.js";
import { registerDeltavGetAlarmsEventsTool } from "../../src/tools/deltavGetAlarmsEvents.js";
import { registerDeltavGetHistoryTool } from "../../src/tools/deltavGetHistory.js";
import { registerDeltavGetNodeContextTool } from "../../src/tools/deltavGetNodeContext.js";
import { registerDeltavSearchGraphTool } from "../../src/tools/deltavSearchGraph.js";
import { createToolCapture } from "../helpers/toolRegistry.js";
import { buildToolContext, startMockFixture } from "../helpers/mockServer.js";

describe("MCP tool integration against mock DeltaV Edge", () => {
  it("supports auth status, graph, node context, history, alarms, and batch tools", async () => {
    const { baseUrl } = await startMockFixture();
    const context = buildToolContext(baseUrl);
    const capture = createToolCapture();
    registerDeltavAuthStatusTool(capture.register, context);
    registerDeltavSearchGraphTool(capture.register, context);
    registerDeltavGetNodeContextTool(capture.register, context);
    registerDeltavGetHistoryTool(capture.register, context);
    registerDeltavGetAlarmsEventsTool(capture.register, context);
    registerBatchTools(capture.register, context);

    const auth = await capture.get("deltav_auth_status").handler({});
    const search = await capture.get("deltav_search_graph").handler({ query: "PID-101", area: "AREA_A", limit: 10 });
    const contextNode = await capture.get("deltav_get_node_context").handler({ entityId: "PID-101" });
    const history = await capture.get("deltav_get_history").handler({
      entityId: "PID1/PV",
      start: "2026-05-06T11:00:00.000Z",
      end: "2026-05-06T12:00:00.000Z",
      maxPoints: 10,
    });
    const alarms = await capture.get("deltav_get_alarms_events").handler({
      start: "2026-05-06T11:00:00.000Z",
      end: "2026-05-06T12:10:00.000Z",
      page: 1,
      pageSize: 10,
      area: "AREA_A",
    });
    const batches = await capture.get("deltav_search_batches").handler({
      start: "2026-05-06T11:00:00.000Z",
      end: "2026-05-06T14:30:00.000Z",
      page: 1,
      pageSize: 10,
    });

    expect((auth as { authenticated: boolean }).authenticated).toBe(true);
    expect((search as { results: unknown[] }).results.length).toBeGreaterThan(0);
    expect((contextNode as { id: string }).id).toBe("PID-101");
    expect((history as { values: unknown[] }).values.length).toBe(10);
    expect((alarms as { records: unknown[] }).records.length).toBeGreaterThan(0);
    expect((batches as { records: unknown[] }).records.length).toBeGreaterThan(0);
  });

  it("enforces access denied and surfaces not found errors", async () => {
    const { baseUrl } = await startMockFixture();
    const deniedContext = buildToolContext(baseUrl, { DELTAV_ALLOWED_AREAS: "AREA_A" });
    const capture = createToolCapture();
    registerDeltavGetAlarmsEventsTool(capture.register, deniedContext);
    registerDeltavGetNodeContextTool(capture.register, deniedContext);

    await expect(
      capture.get("deltav_get_alarms_events").handler({
        start: "2026-05-06T11:00:00.000Z",
        end: "2026-05-06T12:10:00.000Z",
        page: 1,
        pageSize: 10,
        area: "AREA_B",
      }),
    ).rejects.toThrow();

    await expect(
      capture.get("deltav_get_node_context").handler({ entityId: "UNKNOWN_ENTITY" }),
    ).rejects.toThrow();
  });
});
