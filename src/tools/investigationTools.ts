import { z } from "zod";
import type {
  AlarmEventRecord,
  HistoryPoint,
} from "../deltav/types.js";
import { assertTimeRange, parseIsoDateTime } from "../utils/time.js";
import type { ToolContext, ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const rangeSchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
});

const trendPackSchema = rangeSchema.extend({
  entityIds: z.array(z.string().min(1)).min(1),
  maxPoints: z.number().int().min(10).max(1000).default(120),
});

const timelineSchema = rangeSchema.extend({
  area: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
});

const beforeAfterSchema = z.object({
  entityId: z.string().min(1),
  changeTimestamp: z.string().min(1),
  windowHours: z.number().positive().max(72).default(8),
  maxPoints: z.number().int().min(10).max(1000).default(120),
});

function numericSummary(values: readonly HistoryPoint[]) {
  const numeric = values
    .map((value) => value.value)
    .filter((value): value is number => typeof value === "number");

  if (numeric.length === 0) {
    return { count: values.length, min: null, max: null, average: null };
  }

  return {
    count: values.length,
    min: Math.min(...numeric),
    max: Math.max(...numeric),
    average: numeric.reduce((sum, value) => sum + value, 0) / numeric.length,
  };
}

function repeatingAlarmGroups(records: readonly AlarmEventRecord[]) {
  const counts = new Map<string, AlarmEventRecord[]>();
  for (const record of records) {
    const key = `${record.entityId ?? record.module ?? "unknown"}`;
    counts.set(key, [...(counts.get(key) ?? []), record]);
  }

  return Array.from(counts.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      count: group.length,
      entityId: group[0]?.entityId ?? null,
      message: group[0]?.message ?? "",
      timestamps: group.map((record) => record.timestamp),
    }))
    .sort((left, right) => right.count - left.count);
}

function chatteringAlarmGroups(records: readonly AlarmEventRecord[]) {
  return repeatingAlarmGroups(records).filter((group) => {
    if (group.timestamps.length < 2) {
      return false;
    }

    const first = new Date(group.timestamps[0] ?? 0).getTime();
    const last = new Date(group.timestamps.at(-1) ?? 0).getTime();
    return (last - first) / 1000 <= 300;
  });
}

function buildEventTimeline(
  alarms: readonly AlarmEventRecord[],
  historyMarkers: readonly { timestamp: string; message: string; source: string }[],
) {
  return [...alarms.map((record) => ({
    timestamp: record.timestamp,
    type: record.eventType ?? record.type ?? "ALARM_EVENT",
    source: record.entityId ?? record.module ?? "unknown",
    message: record.message,
  })), ...historyMarkers].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export function registerInvestigationTools(register: ToolRegister, context: ToolContext): void {
  register(
    "deltav_get_trend_pack",
    "Retrieve a compact trend pack for multiple parameters over a time range.",
    trendPackSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_get_trend_pack",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const start = parseIsoDateTime(input.start, "start");
          const end = parseIsoDateTime(input.end, "end");
          assertTimeRange(start, end, 24 * 14);

          const trends = await Promise.all(
            input.entityIds.map(async (entityId) => {
              const history = await context.dataSource.getHistoryById(
                entityId,
                start.toISOString(),
                end.toISOString(),
                input.maxPoints,
              );

              return {
                entityId,
                summary: numericSummary(history.values),
                values: history.values,
              };
            }),
          );

          return { start: start.toISOString(), end: end.toISOString(), trends };
        },
      ),
  );

  register(
    "deltav_generate_event_timeline",
    "Combine alarms, events, and history markers into a chronological timeline.",
    timelineSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_generate_event_timeline",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const start = parseIsoDateTime(input.start, "start");
          const end = parseIsoDateTime(input.end, "end");
          const alarms = await context.dataSource.getAlarmsEvents({
            start: start.toISOString(),
            end: end.toISOString(),
            area: input.area,
            entityId: input.entityId,
            page: 1,
            pageSize: 250,
          });

          const markers =
            input.entityId === undefined
              ? []
              : (
                  await context.dataSource.getHistoryById(
                    input.entityId,
                    start.toISOString(),
                    end.toISOString(),
                    24,
                  )
                ).values.map((value) => ({
                  timestamp: value.timestamp,
                  message: `History sample value=${String(value.value)}`,
                  source: input.entityId ?? "unknown",
                }));

          return {
            timeline: buildEventTimeline(alarms.records, markers),
          };
        },
      ),
  );

  register(
    "deltav_correlate_alarms_with_history",
    "Correlate alarms/events against history samples and summarize likely time relationships.",
    trendPackSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_correlate_alarms_with_history",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const start = parseIsoDateTime(input.start, "start");
          const end = parseIsoDateTime(input.end, "end");
          const alarms = await context.dataSource.getAlarmsEvents({
            start: start.toISOString(),
            end: end.toISOString(),
            area: undefined,
            entityId: undefined,
            page: 1,
            pageSize: 250,
          });
          const trendPack = await Promise.all(
            input.entityIds.map((entityId) =>
              context.dataSource.getHistoryById(entityId, start.toISOString(), end.toISOString(), input.maxPoints),
            ),
          );

          return {
            summary: "Correlation is based on timestamp proximity only and does not prove causation.",
            correlations: alarms.records.slice(0, 20).map((record) => ({
              eventId: record.id,
              eventTimestamp: record.timestamp,
              candidateSeries: trendPack.map((history) => ({
                entityId: history.entityId,
                closestValue: history.values.reduce((closest, current) => {
                  if (closest === null) return current;
                  const closestDelta = Math.abs(new Date(closest.timestamp).getTime() - new Date(record.timestamp).getTime());
                  const currentDelta = Math.abs(new Date(current.timestamp).getTime() - new Date(record.timestamp).getTime());
                  return currentDelta < closestDelta ? current : closest;
                }, null as HistoryPoint | null),
              })),
            })),
          };
        },
      ),
  );

  register(
    "deltav_find_first_out",
    "Identify the earliest relevant alarm/event candidate in an abnormal event window.",
    timelineSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_find_first_out",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const alarms = await context.dataSource.getAlarmsEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            area: input.area,
            entityId: input.entityId,
            page: 1,
            pageSize: 250,
          });

          const first = [...alarms.records].sort((left, right) => left.timestamp.localeCompare(right.timestamp))[0];
          return {
            certainty: first ? "candidate_only" : "no_evidence",
            candidate: first ?? null,
            note: "First-out identification is based on earliest visible event timestamp and requires engineering review.",
          };
        },
      ),
  );

  register(
    "deltav_find_repeating_alarms",
    "Find repeated alarms over a time range.",
    timelineSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_find_repeating_alarms",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const alarms = await context.dataSource.getAlarmsEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            area: input.area,
            entityId: input.entityId,
            page: 1,
            pageSize: 500,
          });
          return { groups: repeatingAlarmGroups(alarms.records) };
        },
      ),
  );

  register(
    "deltav_find_chattering_alarms",
    "Find alarms that transition repeatedly in a short interval.",
    timelineSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_find_chattering_alarms",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const alarms = await context.dataSource.getAlarmsEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            area: input.area,
            entityId: input.entityId,
            page: 1,
            pageSize: 500,
          });
          return { groups: chatteringAlarmGroups(alarms.records) };
        },
      ),
  );

  register(
    "deltav_summarize_abnormal_event",
    "Summarize an abnormal event with timeline, first-out candidates, and follow-up questions.",
    timelineSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_summarize_abnormal_event",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const alarms = await context.dataSource.getAlarmsEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            area: input.area,
            entityId: input.entityId,
            page: 1,
            pageSize: 250,
          });
          const firstOut = [...alarms.records].sort((left, right) => left.timestamp.localeCompare(right.timestamp))[0] ?? null;
          return {
            executiveSummary: `${alarms.records.length} alarm/event records were found in the requested window.`,
            timeline: alarms.records.map((record) => ({
              timestamp: record.timestamp,
              message: record.message,
              entityId: record.entityId ?? record.module ?? null,
            })),
            likelyFirstOutCandidates: firstOut ? [firstOut] : [],
            contributingAlarms: alarms.records.filter((record) => record.priority === "HIGH" || record.priority === "CRITICAL"),
            affectedModules: Array.from(new Set(alarms.records.map((record) => record.entityId ?? record.module).filter(Boolean))),
            supportingHistory: input.entityId ? [input.entityId] : [],
            openQuestions: [
              "Was the earliest event the true initiator or only the first recorded consequence?",
              "Are there missing device diagnostics or sequence markers outside this time window?",
            ],
            recommendedEngineeringFollowUp: [
              "Review device diagnostics and maintenance history.",
              "Compare with prior similar events for recurrence patterns.",
            ],
          };
        },
      ),
  );

  register(
    "deltav_compare_before_after_change",
    "Compare history before and after a supplied change timestamp.",
    beforeAfterSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_compare_before_after_change",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const change = parseIsoDateTime(input.changeTimestamp, "changeTimestamp");
          const beforeStart = new Date(change.getTime() - input.windowHours * 60 * 60 * 1000);
          const afterEnd = new Date(change.getTime() + input.windowHours * 60 * 60 * 1000);

          const [before, after] = await Promise.all([
            context.dataSource.getHistoryById(input.entityId, beforeStart.toISOString(), change.toISOString(), input.maxPoints),
            context.dataSource.getHistoryById(input.entityId, change.toISOString(), afterEnd.toISOString(), input.maxPoints),
          ]);

          const beforeSummary = numericSummary(before.values);
          const afterSummary = numericSummary(after.values);
          return {
            entityId: input.entityId,
            changeTimestamp: change.toISOString(),
            before: beforeSummary,
            after: afterSummary,
            delta:
              beforeSummary.average !== null && afterSummary.average !== null
                ? afterSummary.average - beforeSummary.average
                : null,
          };
        },
      ),
  );
}
