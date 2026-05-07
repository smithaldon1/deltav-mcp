import { z } from "zod";
import { assertAccessAllowed } from "../safety/accessControl.js";
import { assertTimeRange, parseIsoDateTime } from "../utils/time.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const MAX_HISTORY_RANGE_HOURS = 24 * 14;

const schema = z.object({
  entityId: z.string().min(1),
  field: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  entityPath: z.string().min(1).optional(),
  start: z.string().min(1).optional(),
  end: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  aggregation: z.string().min(1).optional(),
  maxPoints: z.number().int().min(1).max(10_000).default(500),
});

function summarizeHistory(values: readonly { readonly value: number | string | boolean | null }[]) {
  const numericValues = values
    .map((point) => point.value)
    .filter((value): value is number => typeof value === "number");

  if (numericValues.length === 0) {
    return {
      count: values.length,
      min: null,
      max: null,
      average: null,
    };
  }

  const total = numericValues.reduce((sum, value) => sum + value, 0);
  return {
    count: values.length,
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    average: total / numericValues.length,
  };
}

export function registerDeltavGetHistoryTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "deltav_get_history",
    "Retrieve DeltaV historical values with validated time ranges, point limits, and summary statistics.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_get_history",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const historyEntityId =
            input.field && !input.entityId.endsWith(`/${input.field}`)
              ? `${input.entityId}/${input.field}`
              : input.entityId;
          assertAccessAllowed(context.config, {
            entityId: historyEntityId,
            area: input.area,
            entityPath: input.entityPath,
          });
          const startRaw = input.startTime ?? input.start;
          const endRaw = input.endTime ?? input.end;
          if (!startRaw || !endRaw) {
            throw new Error("startTime/endTime (or start/end) are required.");
          }
          const start = parseIsoDateTime(startRaw, "startTime");
          const end = parseIsoDateTime(endRaw, "endTime");
          assertTimeRange(start, end, MAX_HISTORY_RANGE_HOURS);

          const history = await context.dataSource.getHistory({
            entityId: historyEntityId,
            start: start.toISOString(),
            end: end.toISOString(),
            maxPoints: input.maxPoints,
            ...(input.aggregation ? { aggregation: input.aggregation } : {}),
          });

          return {
            ...history,
            summary: summarizeHistory(history.values),
            empty: history.values.length === 0,
            message:
              history.values.length === 0
                ? "No historical values were returned for the requested range."
                : undefined,
          };
        },
      ),
  );
}
