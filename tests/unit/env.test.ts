import path from "node:path";
import { describe, expect, it } from "vitest";
import { getConfig } from "../../src/config/env.js";
import { ConfigurationError } from "../../src/utils/errors.js";

const validEnv = {
  DELTAV_DATA_SOURCE: "EDGE_REST",
  DELTAV_EDGE_BASE_URL: "https://edge.example/edge/",
  DELTAV_EDGE_USERNAME: "engineer",
  DELTAV_EDGE_PASSWORD: "super-secret",
  DELTAV_EDGE_VERIFY_TLS: "true",
  DELTAV_MCP_MODE: "READ_ONLY",
  DELTAV_ALLOWED_AREAS: "Area100,Area200",
  DELTAV_ALLOWED_ENTITIES: "UNIT_120,TIC_101",
  DELTAV_AUDIT_LOG_PATH: "./logs/audit.log",
  DELTAV_PACKAGE_OUTPUT_DIR: "./generated-packages",
  DELTAV_HTTP_ENABLED: "false",
  DELTAV_HTTP_HOST: "0.0.0.0",
  DELTAV_HTTP_PORT: "3000",
  DELTAV_HTTP_PATH: "/mcp",
  DELTAV_HTTP_STATELESS: "true",
} satisfies NodeJS.ProcessEnv;

describe("getConfig", () => {
  it("parses and normalizes valid configuration", () => {
    const config = getConfig(validEnv);

    expect(config.baseUrl).toBe("https://edge.example/edge");
    expect(config.dataSource).toBe("EDGE_REST");
    expect(config.allowedAreas).toEqual(["Area100", "Area200"]);
    expect(config.allowedEntities).toEqual(["UNIT_120", "TIC_101"]);
    expect(config.auditLogPath).toBe(path.resolve(process.cwd(), "logs/audit.log"));
    expect(config.packageOutputDir).toBe(
      path.resolve(process.cwd(), "generated-packages"),
    );
  });

  it("fails closed on missing required configuration", () => {
    expect(() =>
      getConfig({
        ...validEnv,
        DELTAV_EDGE_BASE_URL: "",
      }),
    ).toThrow(ConfigurationError);
  });

  it("rejects invalid booleans", () => {
    expect(() =>
      getConfig({
        ...validEnv,
        DELTAV_EDGE_VERIFY_TLS: "maybe",
      }),
    ).toThrow(ConfigurationError);
  });

  it("parses OPC UA path configuration inside the repository", () => {
    const config = getConfig({
      ...validEnv,
      DELTAV_DATA_SOURCE: "OPCUA",
      DELTAV_OPCUA_NODE_MAP_PATH: "./config/opcua-node-map.json",
    });

    expect(config.opcua.nodeMapPath).toBe(
      path.resolve(process.cwd(), "config/opcua-node-map.json"),
    );
  });
});
