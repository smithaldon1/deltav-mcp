import { afterEach } from "vitest";
import type { AppConfig } from "../../src/config/env.js";
import { getConfig } from "../../src/config/env.js";
import { AuditLogger } from "../../src/audit/auditLogger.js";
import { createDataSourceAdapter } from "../../src/datasources/dataSourceFactory.js";
import { startMockOpcUaServer } from "../../mock-opcua-server/dist/server.js";
import type { OPCUAServer } from "node-opcua";

const runningServers: OPCUAServer[] = [];

afterEach(async () => {
  await Promise.all(
    runningServers.splice(0).map((server) => server.shutdown(0)),
  );
});

export async function startMockOpcUaFixture(): Promise<{ endpointUrl: string; server: OPCUAServer }> {
  const server = await startMockOpcUaServer({
    host: "127.0.0.1",
    port: 0,
    resourcePath: "/UA/DeltaVMock",
    allowAnonymous: true,
    username: "demo",
    password: "demo",
  });
  runningServers.push(server);
  return {
    server,
    endpointUrl: server.getEndpointUrl(),
  };
}

export function buildOpcUaConfig(
  endpointUrl: string,
  overrides: Partial<NodeJS.ProcessEnv> = {},
): AppConfig {
  return getConfig({
    DELTAV_DATA_SOURCE: "OPCUA",
    DELTAV_EDGE_BASE_URL: "http://localhost:8080/edge/",
    DELTAV_EDGE_USERNAME: "demo",
    DELTAV_EDGE_PASSWORD: "demo",
    DELTAV_EDGE_VERIFY_TLS: "false",
    DELTAV_USE_MOCK: "false",
    DELTAV_MCP_MODE: "READ_ONLY",
    DELTAV_AUDIT_LOG_PATH: "./logs/audit.log",
    DELTAV_PACKAGE_OUTPUT_DIR: "./generated-packages",
    DELTAV_OPCUA_ENDPOINT_URL: endpointUrl,
    DELTAV_OPCUA_SECURITY_MODE: "None",
    DELTAV_OPCUA_SECURITY_POLICY: "None",
    DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS: "true",
    DELTAV_OPCUA_ENABLE_WRITES: "false",
    DELTAV_OPCUA_NODE_MAP_PATH: "./config/opcua-node-map.json",
    DELTAV_HTTP_ENABLED: "false",
    DELTAV_HTTP_HOST: "127.0.0.1",
    DELTAV_HTTP_PORT: "3000",
    DELTAV_HTTP_PATH: "/mcp",
    DELTAV_HTTP_STATELESS: "true",
    ...overrides,
  });
}

export function buildOpcUaToolContext(
  endpointUrl: string,
  overrides: Partial<NodeJS.ProcessEnv> = {},
) {
  const config = buildOpcUaConfig(endpointUrl, overrides);
  return {
    config,
    auditLogger: new AuditLogger(config.auditLogPath),
    dataSource: createDataSourceAdapter(config),
  };
}
