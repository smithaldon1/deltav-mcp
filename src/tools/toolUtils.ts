import type { AuditLogger } from "../audit/auditLogger.js";
import type { AppConfig } from "../config/env.js";
import { inspectForProhibitedActions } from "../safety/guardrails.js";
import { sanitizeForError, toErrorSummary, ValidationError } from "../utils/errors.js";

export async function withToolAudit<TInput, TResult>(
  args: {
    readonly toolName: string;
    readonly input: TInput;
    readonly config: AppConfig;
    readonly auditLogger: AuditLogger;
    readonly sessionId?: string;
  },
  handler: () => Promise<TResult>,
): Promise<TResult | ReturnType<typeof inspectForProhibitedActions>> {
  const refusal = inspectForProhibitedActions(args.input);
  if (refusal) {
    await args.auditLogger.log({
      toolName: args.toolName,
      sanitizedInput: sanitizeForError(args.input),
      status: "refused",
      mode: args.config.mode,
      dataSource: args.config.dataSource,
      callerSession: args.sessionId,
      errorSummary: refusal,
    });
    return refusal;
  }

  try {
    const result = await handler();
    await args.auditLogger.log({
      toolName: args.toolName,
      sanitizedInput: sanitizeForError(args.input),
      status: "success",
      mode: args.config.mode,
      dataSource: args.config.dataSource,
      callerSession: args.sessionId,
      errorSummary: undefined,
    });
    return result;
  } catch (error) {
    await args.auditLogger.log({
      toolName: args.toolName,
      sanitizedInput: sanitizeForError(args.input),
      status: "error",
      mode: args.config.mode,
      dataSource: args.config.dataSource,
      callerSession: args.sessionId,
      errorSummary: toErrorSummary(error),
    });
    throw error;
  }
}

export function assertSandboxEngineeringMode(config: AppConfig): void {
  if (config.mode !== "SANDBOX_ENGINEERING") {
    throw new ValidationError(
      "This tool is only available when DELTAV_MCP_MODE is SANDBOX_ENGINEERING.",
    );
  }
}
