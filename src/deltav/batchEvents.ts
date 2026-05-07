import type { BatchEventsRequest } from "./types.js";

export function buildBatchEventsQuery(
  input: BatchEventsRequest,
  useMock = false,
): URLSearchParams {
  const params = new URLSearchParams(
    useMock
      ? {
          StartTime: input.start,
          EndTime: input.end,
          PN: String(input.page),
          PS: String(input.pageSize),
        }
      : {
          start: input.start,
          end: input.end,
          page: String(input.page),
          pageSize: String(input.pageSize),
        },
  );

  if (input.recipe) {
    params.set("recipe", input.recipe);
  }

  if (input.batchId) {
    params.set("batchId", input.batchId);
  }

  if (input.unit) {
    params.set("unit", input.unit);
  }

  if (input.phase) {
    params.set("phase", input.phase);
  }

  return params;
}
