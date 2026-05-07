import { z } from "zod";
import { assertAccessAllowed } from "../safety/accessControl.js";
import { assertTimeRange, parseIsoDateTime } from "../utils/time.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const MAX_ALARM_RANGE_HOURS = 24 * 7;

const schema = z.object({
  start: z.string().min(1).optional(),
  end: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  page: z.number().int().min(1).default(1),
  pageNumber: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(500).default(100),
  severity: z.string().min(1).optional(),
});

export function registerDeltavGetAlarmsEventsTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "deltav_get_alarms_events",
    "Retrieve DeltaV alarms and events with validated date ranges and pagination controls.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_get_alarms_events",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertAccessAllowed(context.config, {
            area: input.area,
            entityId: input.entityId,
            entityPath: undefined,
          });
          const startRaw = input.startTime ?? input.start;
          const endRaw = input.endTime ?? input.end;
          if (!startRaw || !endRaw) {
            throw new Error("startTime/endTime (or start/end) are required.");
          }
          const start = parseIsoDateTime(startRaw, "startTime");
          const end = parseIsoDateTime(endRaw, "endTime");
          assertTimeRange(start, end, MAX_ALARM_RANGE_HOURS);

          return context.dataSource.getAlarmsEvents({
            start: start.toISOString(),
            end: end.toISOString(),
            area: input.area,
            entityId: input.entityId,
            page: input.pageNumber ?? input.page,
            pageSize: input.pageSize,
          });
        },
      ),
  );
}
