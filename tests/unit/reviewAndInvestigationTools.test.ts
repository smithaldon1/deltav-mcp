import { describe, expect, it } from "vitest";
import { registerBatchTools } from "../../src/tools/batchTools.js";
import { registerDiagramTools } from "../../src/tools/diagramTools.js";
import { registerEngineeringPatternTools } from "../../src/tools/engineeringPatterns.js";
import { registerInvestigationTools } from "../../src/tools/investigationTools.js";
import { registerReviewTools } from "../../src/tools/reviewTools.js";
import { createToolCapture } from "../helpers/toolRegistry.js";
import { buildToolContext, startMockFixture } from "../helpers/mockServer.js";

describe("investigation, review, batch, pattern, and diagram tools", () => {
  it("covers first-out, repeating alarms, chattering alarms, batch timeline, review findings, and Mermaid output", async () => {
    const { baseUrl } = await startMockFixture();
    const readOnlyContext = buildToolContext(baseUrl);
    const sandboxContext = buildToolContext(baseUrl, { DELTAV_MCP_MODE: "SANDBOX_ENGINEERING" });

    const readOnlyCapture = createToolCapture();
    registerInvestigationTools(readOnlyCapture.register, readOnlyContext);
    registerBatchTools(readOnlyCapture.register, readOnlyContext);
    registerReviewTools(readOnlyCapture.register, readOnlyContext);
    registerEngineeringPatternTools(readOnlyCapture.register, readOnlyContext);

    const sandboxCapture = createToolCapture();
    registerDiagramTools(sandboxCapture.register, sandboxContext);

    const firstOut = await readOnlyCapture.get("deltav_find_first_out").handler({
      start: "2026-05-06T11:59:00.000Z",
      end: "2026-05-06T12:06:00.000Z",
    });
    const repeating = await readOnlyCapture.get("deltav_find_repeating_alarms").handler({
      start: "2026-05-06T11:59:00.000Z",
      end: "2026-05-06T12:06:00.000Z",
    });
    const chattering = await readOnlyCapture.get("deltav_find_chattering_alarms").handler({
      start: "2026-05-06T11:59:00.000Z",
      end: "2026-05-06T12:06:00.000Z",
    });
    const batchTimeline = await readOnlyCapture.get("deltav_get_batch_timeline").handler({
      start: "2026-05-06T11:59:00.000Z",
      end: "2026-05-06T14:10:00.000Z",
      page: 1,
      pageSize: 20,
    });
    const review = await readOnlyCapture.get("review_alarm_list").handler({
      alarms: [
        {
          name: "A1",
          condition: "High pressure",
          priority: "CRITICAL",
          operatorAction: "Check",
          consequence: "Pressure",
          rationalization: "Protects equipment",
        },
      ],
    });
    const pattern = await readOnlyCapture.get("engineering_get_pattern").handler({ patternName: "pump_skid" });
    const diagram = await sandboxCapture.get("generate_module_relationship_diagram").handler({
      title: "Pump Skid",
      entities: ["Motor", "Valve", "Flow Loop"],
    });

    expect((firstOut as { candidate: unknown }).candidate).not.toBeNull();
    expect((repeating as { groups: unknown[] }).groups.length).toBeGreaterThan(0);
    expect((chattering as { groups: unknown[] }).groups.length).toBeGreaterThan(0);
    expect((batchTimeline as { timeline: unknown[] }).timeline.length).toBeGreaterThan(0);
    expect((review as { findings: unknown[] }).findings.length).toBeGreaterThan(0);
    expect((pattern as { name: string }).name).toBe("pump_skid");
    expect((diagram as { mermaid: string }).mermaid).toContain("flowchart TD");
  });
});
