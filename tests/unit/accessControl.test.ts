import { describe, expect, it } from "vitest";
import { assertAccessAllowed } from "../../src/safety/accessControl.js";
import { AccessDeniedError } from "../../src/utils/errors.js";

describe("assertAccessAllowed", () => {
  it("allows requests inside configured area and entity allowlists", () => {
    expect(() =>
      assertAccessAllowed(
        {
          allowedAreas: ["Area100"],
          allowedEntities: ["UNIT_120"],
        },
        {
          area: "Area100",
          entityId: "UNIT_120",
          entityPath: undefined,
        },
      ),
    ).not.toThrow();
  });

  it("fails closed when area is outside the allowlist", () => {
    expect(() =>
      assertAccessAllowed(
        {
          allowedAreas: ["Area100"],
          allowedEntities: [],
        },
        {
          area: "Area200",
          entityId: undefined,
          entityPath: undefined,
        },
      ),
    ).toThrow(AccessDeniedError);
  });

  it("fails closed when entity is outside the allowlist", () => {
    expect(() =>
      assertAccessAllowed(
        {
          allowedAreas: [],
          allowedEntities: ["UNIT_120"],
        },
        {
          area: undefined,
          entityId: "UNIT_121",
          entityPath: undefined,
        },
      ),
    ).toThrow(AccessDeniedError);
  });
});
