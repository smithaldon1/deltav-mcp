import { z } from "zod";
import { assertAccessAllowed } from "../safety/accessControl.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const schema = z.object({
  entityId: z.string().min(1),
  area: z.string().min(1).optional(),
  entityPath: z.string().min(1).optional(),
});

export function registerDeltavGetNodeContextTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "deltav_get_node_context",
    "Retrieve metadata and context for a DeltaV entity with allowlist enforcement.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_get_node_context",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertAccessAllowed(context.config, {
            entityId: input.entityId,
            area: input.area,
            entityPath: input.entityPath,
          });
          return context.client.getGraphByEntityId(input.entityId);
        },
      ),
  );
}
