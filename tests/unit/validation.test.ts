import { describe, expect, it } from "vitest";
import { validateStrategy } from "../../src/engineering/validation.js";

describe("validateStrategy", () => {
  it("returns a valid report for a conservative strategy", () => {
    const report = validateStrategy({
      title: "Reactor Feed",
      area: "Area100",
      equipment: ["P-101", "FV-101"],
      objectives: ["Maintain reactor feed flow"],
      controlNarrativeRequirements: [],
      alarms: [
        {
          name: "FAL_101",
          condition: "Low flow",
          priority: "HIGH",
          operatorAction: "Check upstream supply",
          consequence: "Feed starvation",
          rationalization: "Protects batch quality",
        },
      ],
      interlocks: [
        {
          cause: "Low suction pressure",
          condition: "PSL-101 active",
          effect: "Stop feed pump",
          resetRequirement: "Manual reset after pressure recovery",
          bypassAllowed: false,
          notes: "Maintenance bypass is not permitted without MOC.",
        },
      ],
      modes: ["AUTO", "MANUAL"],
      failureScenarios: ["Loss of suction pressure"],
      namingPrefix: "MOD",
    });

    expect(report.valid).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it("detects naming and prohibited-action issues", () => {
    const report = validateStrategy({
      title: "Live Change",
      area: "Area100",
      equipment: ["P-101"],
      objectives: ["Write to DeltaV live"],
      controlNarrativeRequirements: [],
      alarms: [],
      interlocks: [],
      modes: [],
      failureScenarios: [],
      namingPrefix: "bad prefix",
    });

    expect(report.valid).toBe(false);
    expect(report.issues.some((issue) => issue.message.includes("site standard"))).toBe(true);
    expect(report.issues.some((issue) => issue.message.includes("Live control actions"))).toBe(
      true,
    );
  });
});
