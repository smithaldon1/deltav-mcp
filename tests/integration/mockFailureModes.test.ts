import { describe, expect, it } from "vitest";
import { DeltaVEdgeClient } from "../../src/deltav/DeltaVEdgeClient.js";
import { DeltaVClientError } from "../../src/utils/errors.js";
import { buildMockConfig, startMockFixture } from "../helpers/mockServer.js";

describe("mock integration failure modes", () => {
  it("handles invalid token, timeout, malformed response, and empty result scenarios", async () => {
    const { baseUrl } = await startMockFixture();
    const config = buildMockConfig(baseUrl);

    const invalidTokenClient = new DeltaVEdgeClient(config, {
      fetchImpl: async (input, init) => {
        const url = String(input);
        if (url.includes("Login/GetAuthToken")) {
          return fetch(input, init);
        }

        const headers = new Headers(init?.headers);
        headers.set("authorization", "Bearer invalid-token");
        return fetch(input, { ...init, headers });
      },
    });
    await expect(invalidTokenClient.searchGraph({ query: "PID-101", area: undefined, limit: 10 })).rejects.toThrow(DeltaVClientError);

    const timeoutClient = new DeltaVEdgeClient(config, {
      requestTimeoutMs: 50,
      fetchImpl: (input, init) => {
        const headers = new Headers(init?.headers);
        if (!String(input).includes("Login/GetAuthToken")) {
          headers.set("x-mock-delay-ms", "100");
        }
        return fetch(input, { ...init, headers });
      },
    });
    await expect(timeoutClient.searchGraph({ query: "PID-101", area: undefined, limit: 10 })).rejects.toThrow(DeltaVClientError);

    const malformedClient = new DeltaVEdgeClient(config, {
      fetchImpl: (input, init) => {
        const headers = new Headers(init?.headers);
        if (!String(input).includes("Login/GetAuthToken")) {
          headers.set("x-mock-malformed", "true");
        }
        return fetch(input, { ...init, headers });
      },
    });
    await expect(malformedClient.searchGraph({ query: "PID-101", area: undefined, limit: 10 })).rejects.toThrow(DeltaVClientError);

    const emptyClient = new DeltaVEdgeClient(config, {
      fetchImpl: (input, init) => {
        const headers = new Headers(init?.headers);
        if (!String(input).includes("Login/GetAuthToken")) {
          headers.set("x-mock-empty", "true");
        }
        return fetch(input, { ...init, headers });
      },
    });
    const empty = await emptyClient.getAlarmsEvents({
      start: "2026-05-06T11:00:00.000Z",
      end: "2026-05-06T12:10:00.000Z",
      area: undefined,
      entityId: undefined,
      page: 1,
      pageSize: 10,
    });
    expect(empty.records).toEqual([]);
  });
});
