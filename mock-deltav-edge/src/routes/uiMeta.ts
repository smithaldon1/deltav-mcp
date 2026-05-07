import fs from "node:fs/promises";
import path from "node:path";
import type { ServerResponse } from "node:http";
import graphData from "../data/graph.json" with { type: "json" };
import scenariosData from "../data/failure-scenarios.json" with { type: "json" };
import { dataPath } from "../config.js";
import type { MockConfig } from "../config.js";

async function listSystems(): Promise<readonly { name: string; summary: string }[]> {
  const systemsDir = dataPath("systems");
  const files = await fs.readdir(systemsDir);
  const entries = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const contents = await fs.readFile(path.resolve(systemsDir, file), "utf8");
        return JSON.parse(contents) as { name: string; summary: string };
      }),
  );

  return entries;
}

export async function handleUiStatus(config: MockConfig, res: ServerResponse): Promise<void> {
  const systems = await listSystems();
  const rootNodes = graphData.entities.filter((entity) => entity.type === "System");

  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      uiEnabled: true,
      baseUrl: `http://${config.host === "0.0.0.0" ? "localhost" : config.host}:${config.port}/edge/`,
      apiBasePath: config.basePath,
      authEnabled: true,
      mockMode: "development-only",
      systems,
      topLevelEntities: rootNodes.map((entity) => ({
        id: entity.id,
        name: entity.name,
      })),
      healthEndpoint: "/health",
      mcpProxyPath: "/api/mcp",
      mcpToolsListPath: "/api/mcp/rest/tools/list",
      mcpToolCallPath: "/api/mcp/rest/tools/call",
      mcpRestToolsListPath: "/api/mcp/rest/tools/list",
      mcpRestToolCallPath: "/api/mcp/rest/tools/call",
      mcpOpcUaToolsListPath: "/api/mcp/opcua/tools/list",
      mcpOpcUaToolCallPath: "/api/mcp/opcua/tools/call",
      mockOpcUaEndpoint: config.mockOpcUaEndpoint,
      workspaces: [
        "overview",
        "deltaV graph",
        "deltaV trends",
        "deltaV events",
        "opc ua workbench",
        "tool runner",
        "scenarios",
        "setup",
      ],
      endpoints: [
        "POST /edge/api/v1/Login/GetAuthToken/profile",
        "POST /edge/api/v1/Login/GetAuthToken/activedirectory",
        "GET /edge/api/v1/graph",
        "GET /edge/api/v1/graph/:entityId",
        "GET /edge/api/v1/history",
        "GET /edge/api/v1/history/:paramId",
        "GET /edge/api/v1/ae",
        "GET /edge/api/v1/batchevent",
        "GET /api/mcp/rest/tools/list",
        "POST /api/mcp/rest/tools/call",
        "GET /api/mcp/opcua/tools/list",
        "POST /api/mcp/opcua/tools/call",
        "GET /api/mock-ui/opcua-presets",
      ],
    }),
  );
}

export function handleUiScenarios(res: ServerResponse): void {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(scenariosData));
}

export async function handleUiSystems(res: ServerResponse): Promise<void> {
  const systems = await listSystems();
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ systems }));
}

export function handleUiConnectionHelper(res: ServerResponse): void {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      envExample: [
        "# REST MCP service",
        "DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/",
        "DELTAV_EDGE_USERNAME=demo",
        "DELTAV_EDGE_PASSWORD=demo",
        "DELTAV_EDGE_VERIFY_TLS=false",
        "DELTAV_USE_MOCK=true",
        "DELTAV_HTTP_ENABLED=true",
        "DELTAV_HTTP_PORT=3000",
        "DELTAV_DATA_SOURCE=MOCK_EDGE_REST",
        "",
        "# OPC UA MCP service",
        "DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/",
        "DELTAV_EDGE_USERNAME=demo",
        "DELTAV_EDGE_PASSWORD=demo",
        "DELTAV_EDGE_VERIFY_TLS=false",
        "DELTAV_USE_MOCK=true",
        "DELTAV_HTTP_ENABLED=true",
        "DELTAV_HTTP_PORT=3001",
        "DELTAV_DATA_SOURCE=OPCUA",
        "DELTAV_OPCUA_ENDPOINT_URL=opc.tcp://localhost:4840/UA/DeltaVMock",
        "DELTAV_OPCUA_NODE_MAP_PATH=./config/opcua-node-map.json",
      ].join("\n"),
      dockerComposeExample:
        "REST MCP: http://deltav-edge-mcp-rest:3000/mcp\nOPCUA MCP: http://deltav-edge-mcp-opcua:3001/mcp",
      mcpClientConfig: {
        mcpServers: {
          "deltav-edge-rest": {
            command: "node",
            args: ["dist/index.js", "--transport", "http"],
            env: {
              DELTAV_EDGE_BASE_URL: "http://localhost:8080/edge/",
              DELTAV_EDGE_USERNAME: "demo",
              DELTAV_EDGE_PASSWORD: "demo",
              DELTAV_EDGE_VERIFY_TLS: "false",
              DELTAV_USE_MOCK: "true",
              DELTAV_HTTP_ENABLED: "true",
              DELTAV_HTTP_PORT: "3000",
              DELTAV_DATA_SOURCE: "MOCK_EDGE_REST",
            },
          },
          "deltav-edge-opcua": {
            command: "node",
            args: ["dist/index.js", "--transport", "http"],
            env: {
              DELTAV_EDGE_BASE_URL: "http://localhost:8080/edge/",
              DELTAV_EDGE_USERNAME: "demo",
              DELTAV_EDGE_PASSWORD: "demo",
              DELTAV_EDGE_VERIFY_TLS: "false",
              DELTAV_USE_MOCK: "true",
              DELTAV_HTTP_ENABLED: "true",
              DELTAV_HTTP_PORT: "3001",
              DELTAV_DATA_SOURCE: "OPCUA",
              DELTAV_OPCUA_ENDPOINT_URL: "opc.tcp://localhost:4840/UA/DeltaVMock",
            },
          },
        },
      },
    }),
  );
}
