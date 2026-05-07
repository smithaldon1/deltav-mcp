import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import type { AuditLogger } from "../audit/auditLogger.js";
import type { AppConfig } from "../config/env.js";
import type { DeltaVDataSourceAdapter } from "../datasources/DeltaVDataSourceAdapter.js";
import { toErrorSummary } from "../utils/errors.js";
import { registerBatchTools } from "./batchTools.js";
import { registerCreateEngineeringChangePackageTool } from "./createEngineeringChangePackage.js";
import { registerDeltavAuthStatusTool } from "./deltavAuthStatus.js";
import { registerDeltavGetAlarmsEventsTool } from "./deltavGetAlarmsEvents.js";
import { registerDeltavGetHistoryTool } from "./deltavGetHistory.js";
import { registerDeltavGetNodeContextTool } from "./deltavGetNodeContext.js";
import { registerDeltavSearchGraphTool } from "./deltavSearchGraph.js";
import { registerDiagramTools } from "./diagramTools.js";
import { registerEngineeringPatternTools } from "./engineeringPatterns.js";
import { registerGenerateAlarmListTool } from "./generateAlarmList.js";
import { registerGenerateControlModuleDesignTool } from "./generateControlModuleDesign.js";
import { registerGenerateControlNarrativeTool } from "./generateControlNarrative.js";
import { registerGenerateInterlockMatrixTool } from "./generateInterlockMatrix.js";
import { registerGenerateTestProtocolTool } from "./generateTestProtocol.js";
import { registerInvestigationTools } from "./investigationTools.js";
import { registerOpcUaTools } from "./opcuaTools.js";
import { registerReviewTools } from "./reviewTools.js";
import { registerValidateControlStrategyTool } from "./validateControlStrategy.js";

export interface ToolContext {
  readonly config: AppConfig;
  readonly dataSource: DeltaVDataSourceAdapter;
  readonly auditLogger: AuditLogger;
}

export type ToolHandler<TSchema extends z.AnyZodObject> = (
  input: z.infer<TSchema>,
  meta?: { readonly sessionId?: string },
) => Promise<unknown>;

export type ToolRegister = <TSchema extends z.AnyZodObject>(
  name: string,
  description: string,
  schema: TSchema,
  handler: ToolHandler<TSchema>,
) => void;

interface UnsafeMcpToolApi {
  tool(
    name: string,
    description: string,
    paramsSchemaOrAnnotations: unknown,
    cb: (input: unknown, extra: unknown) => Promise<{
      readonly content: readonly { readonly type: "text"; readonly text: string }[];
      readonly isError?: boolean;
    }>,
  ): unknown;
}

function buildMeta(
  extra: unknown,
): { readonly sessionId?: string } | undefined {
  if (
    typeof extra === "object" &&
    extra !== null &&
    "sessionId" in extra &&
    typeof extra.sessionId === "string"
  ) {
    return { sessionId: extra.sessionId };
  }

  return undefined;
}

export function createToolRegistrar(server: McpServer): ToolRegister {
  const unsafeServer = server as unknown as UnsafeMcpToolApi;

  return function registerTool<TSchema extends z.AnyZodObject>(
    name: string,
    description: string,
    schema: TSchema,
    handler: ToolHandler<TSchema>,
  ): void {
    unsafeServer.tool(
      name,
      description,
      schema.shape,
      async (input: unknown, extra: unknown) => {
        try {
          const parsed = schema.parse(input);
          const result = await handler(parsed, buildMeta(extra));

          return {
              content: [
                {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          const summary = toErrorSummary(error);
          return {
            isError: true,
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(summary, null, 2),
              },
            ],
          };
        }
      },
    );
  };
}

export function registerTools(server: McpServer, context: ToolContext): void {
  const register = createToolRegistrar(server);

  registerDeltavAuthStatusTool(register, context);
  registerDeltavSearchGraphTool(register, context);
  registerDeltavGetNodeContextTool(register, context);
  registerDeltavGetHistoryTool(register, context);
  registerDeltavGetAlarmsEventsTool(register, context);
  registerGenerateControlNarrativeTool(register, context);
  registerGenerateControlModuleDesignTool(register, context);
  registerGenerateAlarmListTool(register, context);
  registerGenerateInterlockMatrixTool(register, context);
  registerGenerateTestProtocolTool(register, context);
  registerValidateControlStrategyTool(register, context);
  registerCreateEngineeringChangePackageTool(register, context);
  registerEngineeringPatternTools(register, context);
  registerInvestigationTools(register, context);
  registerBatchTools(register, context);
  registerReviewTools(register, context);
  registerDiagramTools(register, context);
  registerOpcUaTools(register, context);
}
