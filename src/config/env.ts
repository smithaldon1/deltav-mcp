import { config as loadEnv } from "dotenv";
import path from "node:path";
import { z } from "zod";
import { ConfigurationError } from "../utils/errors.js";

loadEnv();

const modeSchema = z.enum(["READ_ONLY", "SANDBOX_ENGINEERING"]);
const dataSourceSchema = z.enum(["EDGE_REST", "MOCK_EDGE_REST", "OPCUA"]);

const rawEnvSchema = z.object({
  DELTAV_DATA_SOURCE: dataSourceSchema.default("MOCK_EDGE_REST"),
  DELTAV_EDGE_BASE_URL: z.string().min(1),
  DELTAV_EDGE_USERNAME: z.string().min(1),
  DELTAV_EDGE_PASSWORD: z.string().min(1),
  DELTAV_EDGE_VERIFY_TLS: z.string().default("true"),
  DELTAV_USE_MOCK: z.string().default("false"),
  DELTAV_MCP_MODE: modeSchema.default("READ_ONLY"),
  DELTAV_ALLOWED_AREAS: z.string().optional(),
  DELTAV_ALLOWED_ENTITIES: z.string().optional(),
  DELTAV_AUDIT_LOG_PATH: z.string().default("./logs/audit.log"),
  DELTAV_PACKAGE_OUTPUT_DIR: z.string().default("./generated-packages"),
  DELTAV_EDGE_ENDPOINT_AUTH_TOKEN: z.string().default("/connect/token"),
  DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION: z.string().default("/api/graph/search"),
  DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY: z.string().default("/api/graph/entities/{entityId}"),
  DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION: z.string().default("/api/history"),
  DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID: z.string().default("/api/history/{entityId}"),
  DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS: z.string().default("/api/ae"),
  DELTAV_EDGE_ENDPOINT_BATCH_EVENTS: z.string().default("/api/batchevent"),
  DELTAV_HTTP_ENABLED: z.string().default("false"),
  DELTAV_HTTP_HOST: z.string().default("0.0.0.0"),
  DELTAV_HTTP_PORT: z.string().default("3000"),
  DELTAV_HTTP_PATH: z.string().default("/mcp"),
  DELTAV_HTTP_STATELESS: z.string().default("true"),
  DELTAV_OPCUA_ENDPOINT_URL: z.string().default("opc.tcp://localhost:4840"),
  DELTAV_OPCUA_SECURITY_MODE: z.string().default("None"),
  DELTAV_OPCUA_SECURITY_POLICY: z.string().default("None"),
  DELTAV_OPCUA_USERNAME: z.string().default(""),
  DELTAV_OPCUA_PASSWORD: z.string().default(""),
  DELTAV_OPCUA_APPLICATION_NAME: z.string().default("deltav-engineering-mcp-server"),
  DELTAV_OPCUA_CERT_DIR: z.string().default("./certs/opcua"),
  DELTAV_OPCUA_TRUST_UNKNOWN_CERTIFICATES: z.string().default("false"),
  DELTAV_OPCUA_SESSION_TIMEOUT_MS: z.string().default("60000"),
  DELTAV_OPCUA_REQUEST_TIMEOUT_MS: z.string().default("30000"),
  DELTAV_OPCUA_MAX_NODES_PER_READ: z.string().default("100"),
  DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS: z.string().default("false"),
  DELTAV_OPCUA_ENABLE_WRITES: z.string().default("false"),
  DELTAV_OPCUA_NODE_MAP_PATH: z.string().default("./config/opcua-node-map.json"),
});

export type DeltaVMcpMode = z.infer<typeof modeSchema>;
export type DeltaVDataSource = z.infer<typeof dataSourceSchema>;

export interface AppConfig {
  readonly dataSource: DeltaVDataSource;
  readonly baseUrl: string;
  readonly username: string;
  readonly password: string;
  readonly verifyTls: boolean;
  readonly useMock: boolean;
  readonly mode: DeltaVMcpMode;
  readonly allowedAreas: readonly string[];
  readonly allowedEntities: readonly string[];
  readonly auditLogPath: string;
  readonly packageOutputDir: string;
  readonly endpoints: {
    readonly authToken: string;
    readonly graphCollection: string;
    readonly graphEntity: string;
    readonly historyCollection: string;
    readonly historyById: string;
    readonly alarmsEvents: string;
    readonly batchEvents: string;
  };
  readonly http: {
    readonly enabled: boolean;
    readonly host: string;
    readonly port: number;
    readonly path: string;
    readonly stateless: boolean;
  };
  readonly opcua: {
    readonly endpointUrl: string;
    readonly securityMode: string;
    readonly securityPolicy: string;
    readonly username: string;
    readonly password: string;
    readonly applicationName: string;
    readonly certDir: string;
    readonly trustUnknownCertificates: boolean;
    readonly sessionTimeoutMs: number;
    readonly requestTimeoutMs: number;
    readonly maxNodesPerRead: number;
    readonly enableSubscriptions: boolean;
    readonly enableWrites: boolean;
    readonly nodeMapPath: string;
  };
}

function parseBoolean(value: string, fieldName: string): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new ConfigurationError(`Invalid boolean value for ${fieldName}.`, {
    fieldName,
  });
}

function parseCsv(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function resolveInsideRepo(inputPath: string, fieldName: string): string {
  const resolved = path.resolve(process.cwd(), inputPath);

  if (!resolved.startsWith(process.cwd())) {
    throw new ConfigurationError(
      `${fieldName} must resolve inside the repository working directory.`,
      { fieldName },
    );
  }

  return resolved;
}

export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = rawEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new ConfigurationError("Missing or invalid environment configuration.", {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const values = parsed.data;
  const httpPort = Number(values.DELTAV_HTTP_PORT);
  const opcuaSessionTimeoutMs = Number(values.DELTAV_OPCUA_SESSION_TIMEOUT_MS);
  const opcuaRequestTimeoutMs = Number(values.DELTAV_OPCUA_REQUEST_TIMEOUT_MS);
  const opcuaMaxNodesPerRead = Number(values.DELTAV_OPCUA_MAX_NODES_PER_READ);
  if (!Number.isInteger(httpPort) || httpPort <= 0 || httpPort > 65535) {
    throw new ConfigurationError("Invalid DELTAV_HTTP_PORT value.", {
      fieldName: "DELTAV_HTTP_PORT",
    });
  }
  if (!Number.isInteger(opcuaSessionTimeoutMs) || opcuaSessionTimeoutMs <= 0) {
    throw new ConfigurationError("Invalid DELTAV_OPCUA_SESSION_TIMEOUT_MS value.", {
      fieldName: "DELTAV_OPCUA_SESSION_TIMEOUT_MS",
    });
  }
  if (!Number.isInteger(opcuaRequestTimeoutMs) || opcuaRequestTimeoutMs <= 0) {
    throw new ConfigurationError("Invalid DELTAV_OPCUA_REQUEST_TIMEOUT_MS value.", {
      fieldName: "DELTAV_OPCUA_REQUEST_TIMEOUT_MS",
    });
  }
  if (!Number.isInteger(opcuaMaxNodesPerRead) || opcuaMaxNodesPerRead <= 0) {
    throw new ConfigurationError("Invalid DELTAV_OPCUA_MAX_NODES_PER_READ value.", {
      fieldName: "DELTAV_OPCUA_MAX_NODES_PER_READ",
    });
  }

  return {
    dataSource: values.DELTAV_DATA_SOURCE,
    baseUrl: values.DELTAV_EDGE_BASE_URL.replace(/\/+$/, ""),
    username: values.DELTAV_EDGE_USERNAME,
    password: values.DELTAV_EDGE_PASSWORD,
    verifyTls: parseBoolean(values.DELTAV_EDGE_VERIFY_TLS, "DELTAV_EDGE_VERIFY_TLS"),
    useMock:
      values.DELTAV_DATA_SOURCE === "MOCK_EDGE_REST"
        ? true
        : parseBoolean(values.DELTAV_USE_MOCK, "DELTAV_USE_MOCK"),
    mode: values.DELTAV_MCP_MODE,
    allowedAreas: parseCsv(values.DELTAV_ALLOWED_AREAS),
    allowedEntities: parseCsv(values.DELTAV_ALLOWED_ENTITIES),
    auditLogPath: resolveInsideRepo(values.DELTAV_AUDIT_LOG_PATH, "DELTAV_AUDIT_LOG_PATH"),
    packageOutputDir: resolveInsideRepo(
      values.DELTAV_PACKAGE_OUTPUT_DIR,
      "DELTAV_PACKAGE_OUTPUT_DIR",
    ),
    endpoints: {
      authToken: values.DELTAV_EDGE_ENDPOINT_AUTH_TOKEN,
      graphCollection: values.DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION,
      graphEntity: values.DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY,
      historyCollection: values.DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION,
      historyById: values.DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID,
      alarmsEvents: values.DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS,
      batchEvents: values.DELTAV_EDGE_ENDPOINT_BATCH_EVENTS,
    },
    http: {
      enabled: parseBoolean(values.DELTAV_HTTP_ENABLED, "DELTAV_HTTP_ENABLED"),
      host: values.DELTAV_HTTP_HOST,
      port: httpPort,
      path: values.DELTAV_HTTP_PATH.startsWith("/")
        ? values.DELTAV_HTTP_PATH
        : `/${values.DELTAV_HTTP_PATH}`,
      stateless: parseBoolean(values.DELTAV_HTTP_STATELESS, "DELTAV_HTTP_STATELESS"),
    },
    opcua: {
      endpointUrl: values.DELTAV_OPCUA_ENDPOINT_URL,
      securityMode: values.DELTAV_OPCUA_SECURITY_MODE,
      securityPolicy: values.DELTAV_OPCUA_SECURITY_POLICY,
      username: values.DELTAV_OPCUA_USERNAME,
      password: values.DELTAV_OPCUA_PASSWORD,
      applicationName: values.DELTAV_OPCUA_APPLICATION_NAME,
      certDir: resolveInsideRepo(values.DELTAV_OPCUA_CERT_DIR, "DELTAV_OPCUA_CERT_DIR"),
      trustUnknownCertificates: parseBoolean(
        values.DELTAV_OPCUA_TRUST_UNKNOWN_CERTIFICATES,
        "DELTAV_OPCUA_TRUST_UNKNOWN_CERTIFICATES",
      ),
      sessionTimeoutMs: opcuaSessionTimeoutMs,
      requestTimeoutMs: opcuaRequestTimeoutMs,
      maxNodesPerRead: opcuaMaxNodesPerRead,
      enableSubscriptions: parseBoolean(
        values.DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS,
        "DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS",
      ),
      enableWrites: parseBoolean(
        values.DELTAV_OPCUA_ENABLE_WRITES,
        "DELTAV_OPCUA_ENABLE_WRITES",
      ),
      nodeMapPath: resolveInsideRepo(
        values.DELTAV_OPCUA_NODE_MAP_PATH,
        "DELTAV_OPCUA_NODE_MAP_PATH",
      ),
    },
  };
}
