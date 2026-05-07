import { z } from "zod";
import { getEngineeringPattern, listEngineeringPatterns } from "../engineering/patterns/index.js";
import { ValidationError } from "../utils/errors.js";
import type { ToolContext, ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const getPatternSchema = z.object({
  patternName: z.string().min(1),
});

const listPatternSchema = z.object({});

export function registerEngineeringPatternTools(register: ToolRegister, context: ToolContext): void {
  register(
    "engineering_list_patterns",
    "List available engineering design patterns and summaries.",
    listPatternSchema,
    async (_input, meta) =>
      withToolAudit(
        {
          toolName: "engineering_list_patterns",
          input: {},
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => ({
          patterns: listEngineeringPatterns(),
        }),
      ),
  );

  register(
    "engineering_get_pattern",
    "Get a structured engineering pattern by name.",
    getPatternSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "engineering_get_pattern",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const pattern = getEngineeringPattern(input.patternName);
          if (!pattern) {
            throw new ValidationError("Engineering pattern not found.", {
              patternName: input.patternName,
            });
          }

          return pattern;
        },
      ),
  );
}
