import type { ServerResponse } from "node:http";
import historyData from "../data/history.json" with { type: "json" };
import { aggregateSeries, generateTimeSeries } from "../utils/timeSeries.js";
import { MockHttpError } from "../utils/errors.js";

type HistorySeries = (typeof historyData.series)[number];

function findSeriesByParam(url: URL, paramId: string): HistorySeries | undefined {
  const pathQuery = url.searchParams.get("path");
  return historyData.series.find(
    (item) => item.paramId === paramId || (pathQuery !== null && item.path === pathQuery),
  );
}

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new MockHttpError(400, "Invalid date parameter.");
  }
  return date;
}

function pointCount(url: URL): number {
  const ps = Number(url.searchParams.get("PS") ?? url.searchParams.get("maxPoints") ?? "60");
  return Number.isFinite(ps) && ps > 0 ? Math.min(ps, 500) : 60;
}

export function handleHistory(url: URL, res: ServerResponse, paramId?: string): void {
  const resolvedParamId = paramId ?? url.searchParams.get("path")?.split("/").slice(-2, -1)[0];
  if (!resolvedParamId) {
    throw new MockHttpError(400, "History request requires a param id or path.");
  }

  const series = findSeriesByParam(url, resolvedParamId);
  if (!series) {
    throw new MockHttpError(404, "History series not found.", { paramId: resolvedParamId });
  }

  const endTime = parseDate(url.searchParams.get("EndTime"), new Date("2026-05-06T12:10:00.000Z"));
  const startTime = parseDate(url.searchParams.get("StartTime"), new Date(endTime.getTime() - 60 * 60 * 1000));
  const values = generateTimeSeries(series, startTime, endTime, pointCount(url));
  const aggregation = url.searchParams.get("Aggregation");

  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      entityId: resolvedParamId,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      values,
      aggregation,
      aggregateValue: aggregation ? aggregateSeries(values, aggregation) : undefined
    }),
  );
}
