import { describe, expect, it, vi } from "vitest";
import { getConfig } from "../../src/config/env.js";
import { DeltaVEdgeClient } from "../../src/deltav/DeltaVEdgeClient.js";
import { DeltaVClientError } from "../../src/utils/errors.js";

const config = getConfig({
  DELTAV_DATA_SOURCE: "MOCK_EDGE_REST",
  DELTAV_EDGE_BASE_URL: "https://edge.example/edge",
  DELTAV_EDGE_USERNAME: "engineer",
  DELTAV_EDGE_PASSWORD: "password-1",
  DELTAV_EDGE_VERIFY_TLS: "true",
  DELTAV_MCP_MODE: "READ_ONLY",
  DELTAV_AUDIT_LOG_PATH: "./logs/audit.log",
  DELTAV_PACKAGE_OUTPUT_DIR: "./generated-packages",
  DELTAV_HTTP_ENABLED: "false",
  DELTAV_HTTP_HOST: "0.0.0.0",
  DELTAV_HTTP_PORT: "3000",
  DELTAV_HTTP_PATH: "/mcp",
  DELTAV_HTTP_STATELESS: "true",
});

describe("DeltaVEdgeClient", () => {
  it("constructs auth and history requests correctly", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "token-123",
            token_type: "Bearer",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            entityId: "TIC_101/PV",
            start: "2026-05-06T00:00:00.000Z",
            end: "2026-05-06T01:00:00.000Z",
            values: [],
          }),
          { status: 200 },
        ),
      );

    const client = new DeltaVEdgeClient(config, { fetchImpl: fetchMock });
    await client.getHistoryById(
      "TIC_101/PV",
      "2026-05-06T00:00:00.000Z",
      "2026-05-06T01:00:00.000Z",
      250,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://edge.example/edge/connect/token");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "/api/history/TIC_101%2FPV?StartTime=2026-05-06T00%3A00%3A00.000Z",
    );
  });

  it("raises a sanitized client error on authentication failure", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("denied", { status: 401 }),
    );

    const client = new DeltaVEdgeClient(config, { fetchImpl: fetchMock });

    await expect(client.authenticate(true)).rejects.toThrow(DeltaVClientError);
  });
});
