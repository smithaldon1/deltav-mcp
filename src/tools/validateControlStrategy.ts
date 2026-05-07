import { strategyInputSchema } from "../engineering/schemas.js";
import { validateStrategy } from "../engineering/validation.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const schema = strategyInputSchema;

export function registerValidateControlStrategyTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "validate_control_strategy",
    "Validate a proposed control strategy against site-standard checks and prohibited live-write patterns.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "validate_control_strategy",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => validateStrategy(input),
      ),
  );
}
