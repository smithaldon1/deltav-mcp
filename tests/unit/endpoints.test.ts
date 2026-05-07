import { describe, expect, it } from "vitest";
import { defaultEndpoints } from "../../src/deltav/endpoints.js";

describe("endpoints", () => {
  it("uses the centralized assumed DeltaV Edge endpoint map", () => {
    expect(defaultEndpoints).toEqual({
      authToken: "/connect/token",
      graphSearch: "/api/graph/search",
      graphEntity: "/api/graph/entities/{entityId}",
      historyCollection: "/api/history",
      historyById: "/api/history/{entityId}",
      alarmsEvents: "/api/ae",
      batchEvents: "/api/batchevent",
    });
  });
});
