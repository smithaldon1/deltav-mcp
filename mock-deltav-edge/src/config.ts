import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(moduleDir, "..");

export interface MockConfig {
  readonly host: string;
  readonly port: number;
  readonly basePath: string;
  readonly developmentAuthMode: boolean;
  readonly mcpRestBaseUrl: string;
  readonly mcpOpcUaBaseUrl: string;
  readonly mockOpcUaEndpoint: string;
}

export function getMockConfig(env: NodeJS.ProcessEnv = process.env): MockConfig {
  return {
    host: env.MOCK_DELTAV_EDGE_HOST ?? "0.0.0.0",
    port: Number(env.MOCK_DELTAV_EDGE_PORT ?? "8080"),
    basePath: env.MOCK_DELTAV_EDGE_BASE_PATH ?? "/edge/api/v1",
    developmentAuthMode: (env.MOCK_DELTAV_EDGE_DEV_AUTH ?? "true") === "true",
    mcpRestBaseUrl:
      env.MOCK_DELTAV_EDGE_MCP_REST_BASE_URL ??
      env.MOCK_DELTAV_EDGE_MCP_BASE_URL ??
      "http://localhost:3000/mcp",
    mcpOpcUaBaseUrl:
      env.MOCK_DELTAV_EDGE_MCP_OPCUA_BASE_URL ??
      env.MOCK_DELTAV_EDGE_MCP_BASE_URL ??
      "http://localhost:3001/mcp",
    mockOpcUaEndpoint: env.MOCK_OPCUA_BROWSER_ENDPOINT ?? "opc.tcp://localhost:4840/UA/DeltaVMock",
  };
}

export function dataPath(...parts: string[]): string {
  return path.resolve(packageRoot, "src", "data", ...parts);
}

export function uiDistPath(...parts: string[]): string {
  return path.resolve(packageRoot, "ui", "dist", ...parts);
}
