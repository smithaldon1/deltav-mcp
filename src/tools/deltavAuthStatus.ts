import { z } from "zod";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const schema = z.object({});

export function registerDeltavAuthStatusTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "deltav_auth_status",
    "Check whether the server can authenticate to DeltaV Edge without exposing secrets.",
    schema,
    async (_input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_auth_status",
          input: {},
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          await context.client.authenticate(true);
          return context.client.getAuthStatus();
        },
      ),
  );
}
