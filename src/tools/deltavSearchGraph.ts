import { z } from "zod";
import { assertAccessAllowed } from "../safety/accessControl.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const schema = z.object({
  query: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

export function registerDeltavSearchGraphTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "deltav_search_graph",
    "Search or browse the DeltaV graph/hierarchy with access control and result limits.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_search_graph",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertAccessAllowed(context.config, {
            area: input.area,
            entityId: undefined,
            entityPath: undefined,
          });
          return context.client.searchGraph({
            query: input.query,
            area: input.area,
            limit: input.limit,
          });
        },
      ),
  );
}
