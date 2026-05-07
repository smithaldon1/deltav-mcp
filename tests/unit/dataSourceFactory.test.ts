import { describe, expect, it } from "vitest";
import { createDataSourceAdapter } from "../../src/datasources/dataSourceFactory.js";
import { getConfig } from "../../src/config/env.js";

function buildEnv(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    DELTAV_DATA_SOURCE: "MOCK_EDGE_REST",
    DELTAV_EDGE_BASE_URL: "http://localhost:8080/edge/",
    DELTAV_EDGE_USERNAME: "demo",
    DELTAV_EDGE_PASSWORD: "demo",
    DELTAV_EDGE_VERIFY_TLS: "false",
    DELTAV_USE_MOCK: "true",
    DELTAV_MCP_MODE: "READ_ONLY",
    DELTAV_AUDIT_LOG_PATH: "./logs/audit.log",
    DELTAV_PACKAGE_OUTPUT_DIR: "./generated-packages",
    DELTAV_EDGE_ENDPOINT_AUTH_TOKEN: "/api/v1/Login/GetAuthToken/profile",
    DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION: "/api/v1/graph",
    DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY: "/api/v1/graph/{entityId}",
    DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION: "/api/v1/history",
    DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID: "/api/v1/history/{entityId}",
    DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS: "/api/v1/ae",
    DELTAV_EDGE_ENDPOINT_BATCH_EVENTS: "/api/v1/batchevent",
    DELTAV_HTTP_ENABLED: "false",
    ...overrides,
  };
}

describe("createDataSourceAdapter", () => {
  it("selects the mock REST adapter when configured", () => {
    const adapter = createDataSourceAdapter(getConfig(buildEnv()));
    expect(adapter.kind).toBe("MOCK_EDGE_REST");
  });

  it("selects the edge REST adapter when configured", () => {
    const adapter = createDataSourceAdapter(
      getConfig(buildEnv({ DELTAV_DATA_SOURCE: "EDGE_REST", DELTAV_USE_MOCK: "false" })),
    );
    expect(adapter.kind).toBe("EDGE_REST");
  });

  it("selects the OPC UA adapter when configured", () => {
    const adapter = createDataSourceAdapter(
      getConfig(buildEnv({ DELTAV_DATA_SOURCE: "OPCUA" })),
    );
    expect(adapter.kind).toBe("OPCUA");
  });
});
