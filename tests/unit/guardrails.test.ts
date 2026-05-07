import { describe, expect, it } from "vitest";
import { detectProhibitedRequest } from "../../src/safety/prohibitedActions.js";
import { inspectForProhibitedActions } from "../../src/safety/guardrails.js";

describe("guardrails", () => {
  it("detects prohibited live-control language", () => {
    const result = detectProhibitedRequest("Please change this setpoint on the live unit.");

    expect(result).not.toBeNull();
    expect(result?.allowed).toBe(false);
    expect(result?.safeAlternative).toContain("offline engineering change package");
  });

  it("walks nested tool input when checking for prohibited actions", () => {
    const result = inspectForProhibitedActions({
      notes: ["normal request", "disable this alarm immediately"],
    });

    expect(result).not.toBeNull();
  });
});
