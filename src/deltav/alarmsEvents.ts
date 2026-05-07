import type { AlarmsEventsRequest } from "./types.js";

export function buildAlarmsEventsQuery(
  input: AlarmsEventsRequest,
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

  if (input.area) {
    params.set("area", input.area);
  }

  if (input.entityId) {
    params.set("entityId", input.entityId);
  }

  return params;
}
