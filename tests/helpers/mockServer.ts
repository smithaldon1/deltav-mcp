import type { Server } from "node:http";
import { afterEach } from "vitest";
import type { AppConfig } from "../../src/config/env.js";
import { getConfig } from "../../src/config/env.js";
import { AuditLogger } from "../../src/audit/auditLogger.js";
import { DeltaVEdgeClient } from "../../src/deltav/DeltaVEdgeClient.js";
import { createMockServer } from "../../mock-deltav-edge/dist/server.js";

const runningServers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    runningServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.closeAllConnections();
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

export async function startMockFixture(): Promise<{ baseUrl: string; server: Server }> {
  const server = createMockServer({
    host: "127.0.0.1",
    port: 0,
    basePath: "/edge/api/v1",
    developmentAuthMode: true,
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  runningServers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve mock server address.");
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/edge/`,
  };
}

export function buildMockConfig(baseUrl: string, overrides: Partial<NodeJS.ProcessEnv> = {}): AppConfig {
  return getConfig({
    DELTAV_EDGE_BASE_URL: baseUrl,
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
    DELTAV_HTTP_HOST: "127.0.0.1",
    DELTAV_HTTP_PORT: "3000",
    DELTAV_HTTP_PATH: "/mcp",
    DELTAV_HTTP_STATELESS: "true",
    ...overrides,
  });
}

export function buildToolContext(baseUrl: string, overrides: Partial<NodeJS.ProcessEnv> = {}) {
  const config = buildMockConfig(baseUrl, overrides);
  return {
    config,
    auditLogger: new AuditLogger(config.auditLogPath),
    client: new DeltaVEdgeClient(config),
  };
}
