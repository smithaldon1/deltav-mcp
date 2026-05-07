import { config as loadEnv } from "dotenv";
import path from "node:path";
import { z } from "zod";
import { ConfigurationError } from "../utils/errors.js";

loadEnv();

const modeSchema = z.enum(["READ_ONLY", "SANDBOX_ENGINEERING"]);

const rawEnvSchema = z.object({
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
});

export type DeltaVMcpMode = z.infer<typeof modeSchema>;

export interface AppConfig {
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
  if (!Number.isInteger(httpPort) || httpPort <= 0 || httpPort > 65535) {
    throw new ConfigurationError("Invalid DELTAV_HTTP_PORT value.", {
      fieldName: "DELTAV_HTTP_PORT",
    });
  }

  return {
    baseUrl: values.DELTAV_EDGE_BASE_URL.replace(/\/+$/, ""),
    username: values.DELTAV_EDGE_USERNAME,
    password: values.DELTAV_EDGE_PASSWORD,
    verifyTls: parseBoolean(values.DELTAV_EDGE_VERIFY_TLS, "DELTAV_EDGE_VERIFY_TLS"),
    useMock: parseBoolean(values.DELTAV_USE_MOCK, "DELTAV_USE_MOCK"),
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
  };
}
