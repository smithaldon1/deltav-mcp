import type { ServerResponse } from "node:http";
import batchData from "../data/batch-events.json" with { type: "json" };
import { paginate } from "../utils/pagination.js";

export function handleBatchEvents(url: URL, res: ServerResponse): void {
  const recipe = url.searchParams.get("recipe");
  const batchId = url.searchParams.get("batchId");
  const unit = url.searchParams.get("unit");
  const phase = url.searchParams.get("phase");
  const startTime = url.searchParams.get("StartTime");
  const endTime = url.searchParams.get("EndTime");
  const pageSize = Number(url.searchParams.get("PS") ?? "100");
  const pageNumber = Number(url.searchParams.get("PN") ?? "1");

  let records = batchData.records;

  if (recipe) records = records.filter((record) => record.recipe === recipe);
  if (batchId) records = records.filter((record) => record.batchId === batchId);
  if (unit) records = records.filter((record) => record.unit === unit);
  if (phase) records = records.filter((record) => record.phase === phase);
  if (startTime) records = records.filter((record) => record.timestamp >= startTime);
  if (endTime) records = records.filter((record) => record.timestamp <= endTime);

  const paged = paginate(records, pageNumber, pageSize);

  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      page: paged.pageNumber,
      pageSize: paged.pageSize,
      total: paged.total,
      records: paged.items,
    }),
  );
}
