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
      endpoints: [
        "POST /edge/api/v1/Login/GetAuthToken/profile",
        "POST /edge/api/v1/Login/GetAuthToken/activedirectory",
        "GET /edge/api/v1/graph",
        "GET /edge/api/v1/graph/:entityId",
        "GET /edge/api/v1/history",
        "GET /edge/api/v1/history/:paramId",
        "GET /edge/api/v1/ae",
        "GET /edge/api/v1/batchevent",
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
        "DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/",
        "DELTAV_EDGE_USERNAME=demo",
        "DELTAV_EDGE_PASSWORD=demo",
        "DELTAV_EDGE_VERIFY_TLS=false",
        "DELTAV_USE_MOCK=true",
      ].join("\n"),
      dockerComposeExample: "DELTAV_EDGE_BASE_URL=http://mock-deltav-edge:8080/edge/",
      mcpClientConfig: {
        mcpServers: {
          "deltav-edge": {
            command: "node",
            args: ["dist/index.js"],
            env: {
              DELTAV_EDGE_BASE_URL: "http://localhost:8080/edge/",
              DELTAV_EDGE_USERNAME: "demo",
              DELTAV_EDGE_PASSWORD: "demo",
              DELTAV_EDGE_VERIFY_TLS: "false",
              DELTAV_USE_MOCK: "true",
            },
          },
        },
      },
    }),
  );
}
