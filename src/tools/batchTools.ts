import { z } from "zod";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import { ValidationError } from "../utils/errors.js";
import { parseIsoDateTime } from "../utils/time.js";
import type { ToolContext, ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const batchQuerySchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  recipe: z.string().min(1).optional(),
  batchId: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  phase: z.string().min(1).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(500).default(100),
});

const compareBatchesSchema = z.object({
  leftBatchId: z.string().min(1),
  rightBatchId: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
});

const phaseLogicSchema = z.object({
  phaseName: z.string().min(1),
  unit: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  permissives: z.array(z.string().min(1)).default([]),
  holds: z.array(z.string().min(1)).default([]),
  abortConditions: z.array(z.string().min(1)).default([]),
});

export function registerBatchTools(register: ToolRegister, context: ToolContext): void {
  register(
    "deltav_search_batches",
    "Search mock or configured DeltaV batch events in a time range.",
    batchQuerySchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_search_batches",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () =>
          context.client.getBatchEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            recipe: input.recipe,
            batchId: input.batchId,
            unit: input.unit,
            phase: input.phase,
            page: input.page,
            pageSize: input.pageSize,
          }),
      ),
  );

  register(
    "deltav_get_batch_timeline",
    "Get a chronological timeline for a batch or batch filter.",
    batchQuerySchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_get_batch_timeline",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const events = await context.client.getBatchEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            recipe: input.recipe,
            batchId: input.batchId,
            unit: input.unit,
            phase: input.phase,
            page: input.page,
            pageSize: input.pageSize,
          });

          return {
            timeline: [...events.records].sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
          };
        },
      ),
  );

  register(
    "deltav_compare_batches",
    "Compare two batches by status progression and event counts.",
    compareBatchesSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_compare_batches",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const [left, right] = await Promise.all([
            context.client.getBatchEvents({
              start: parseIsoDateTime(input.start, "start").toISOString(),
              end: parseIsoDateTime(input.end, "end").toISOString(),
              recipe: undefined,
              batchId: input.leftBatchId,
              unit: undefined,
              phase: undefined,
              page: 1,
              pageSize: 200,
            }),
            context.client.getBatchEvents({
              start: parseIsoDateTime(input.start, "start").toISOString(),
              end: parseIsoDateTime(input.end, "end").toISOString(),
              recipe: undefined,
              batchId: input.rightBatchId,
              unit: undefined,
              phase: undefined,
              page: 1,
              pageSize: 200,
            }),
          ]);

          return {
            leftBatchId: input.leftBatchId,
            rightBatchId: input.rightBatchId,
            leftStatuses: left.records.map((record) => record.status),
            rightStatuses: right.records.map((record) => record.status),
            leftCount: left.records.length,
            rightCount: right.records.length,
          };
        },
      ),
  );

  register(
    "deltav_find_batch_deviation_window",
    "Identify a likely deviation window from batch hold, fail, or abort events.",
    batchQuerySchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_find_batch_deviation_window",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const events = await context.client.getBatchEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            recipe: input.recipe,
            batchId: input.batchId,
            unit: input.unit,
            phase: input.phase,
            page: input.page,
            pageSize: input.pageSize,
          });
          const deviation = events.records.find((record) => ["HOLD", "FAIL", "ABORT"].includes(record.eventType));
          return {
            deviationWindowStart: deviation?.timestamp ?? null,
            candidate: deviation ?? null,
            note: "Deviation windows are inferred from batch event state changes only.",
          };
        },
      ),
  );

  register(
    "deltav_summarize_phase_failures",
    "Summarize recurring phase failures and holds from batch event data.",
    batchQuerySchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "deltav_summarize_phase_failures",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          const events = await context.client.getBatchEvents({
            start: parseIsoDateTime(input.start, "start").toISOString(),
            end: parseIsoDateTime(input.end, "end").toISOString(),
            recipe: input.recipe,
            batchId: input.batchId,
            unit: input.unit,
            phase: input.phase,
            page: input.page,
            pageSize: input.pageSize,
          });
          const failures = events.records.filter((record) => ["HOLD", "FAIL", "ABORT"].includes(record.eventType));
          return {
            failureCount: failures.length,
            failures,
          };
        },
      ),
  );

  register(
    "generate_phase_logic",
    "Generate offline proposed phase logic for engineering review.",
    phaseLogicSchema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "generate_phase_logic",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertSandboxEngineeringMode(context.config);
          if (input.objectives.length === 0) {
            throw new ValidationError("Phase objectives are required.");
          }

          return {
            phaseName: input.phaseName,
            unit: input.unit,
            disclaimer:
              "Proposed artifact only. Requires qualified engineering review and site MOC before any implementation.",
            states: ["IDLE", "RUNNING", "HELD", "COMPLETE", "ABORTED"],
            permissives: input.permissives,
            holds: input.holds,
            abortConditions: input.abortConditions,
            openQuestions: deriveOpenEngineeringQuestions({
              objectives: input.objectives,
              interlocks: input.abortConditions.map((condition) => ({
                cause: condition,
                condition,
                effect: "Abort phase",
                resetRequirement: "",
                bypassAllowed: false,
                notes: "",
              })),
            }),
          };
        },
      ),
  );
}
