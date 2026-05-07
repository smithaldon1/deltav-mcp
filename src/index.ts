import { AuditLogger } from "./audit/auditLogger.js";
import { getConfig } from "./config/env.js";
import { DeltaVEdgeClient } from "./deltav/DeltaVEdgeClient.js";
import { startHttpTransport, startStdioTransport } from "./server/transports.js";

async function main(): Promise<void> {
  const config = getConfig();
  const auditLogger = new AuditLogger(config.auditLogPath);
  const client = new DeltaVEdgeClient(config);
  const context = {
    config,
    auditLogger,
    client,
  } as const;

  if (config.http.enabled) {
    await startHttpTransport(config, context);
    return;
  }

  await startStdioTransport(context);
}

await main();
