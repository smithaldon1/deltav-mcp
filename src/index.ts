import { AuditLogger } from "./audit/auditLogger.js";
import { getConfig } from "./config/env.js";
import { createDataSourceAdapter } from "./datasources/dataSourceFactory.js";
import { startHttpTransport, startStdioTransport } from "./server/transports.js";
import { redactSecrets } from "./utils/redaction.js";

function parseTransportArg(argv: readonly string[]): "stdio" | "http" | undefined {
  const transportIndex = argv.findIndex((arg) => arg === "--transport");
  if (transportIndex < 0) {
    return undefined;
  }

  const value = argv[transportIndex + 1];
  if (value === "stdio" || value === "http") {
    return value;
  }

  throw new Error("Invalid --transport value. Use 'stdio' or 'http'.");
}

async function main(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  const config = getConfig();
  const auditLogger = new AuditLogger(config.auditLogPath);
  const dataSource = createDataSourceAdapter(config);
  const context = {
    config,
    auditLogger,
    dataSource,
  } as const;
  const requestedTransport = parseTransportArg(argv);

  if (requestedTransport === "http" || (requestedTransport === undefined && config.http.enabled)) {
    await startHttpTransport(config, context);
    return;
  }

  await startStdioTransport(context);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${redactSecrets(error instanceof Error ? error.message : "Startup failed.")}\n`);
  process.exitCode = 1;
}
