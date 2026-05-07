import type { ServerResponse } from "node:http";
import alarmData from "../data/alarms-events.json" with { type: "json" };
import { paginate } from "../utils/pagination.js";

export function handleAlarmsEvents(url: URL, res: ServerResponse): void {
  const area = url.searchParams.get("area");
  const moduleName = url.searchParams.get("module");
  const priority = url.searchParams.get("priority");
  const eventType = url.searchParams.get("eventType");
  const entityId = url.searchParams.get("entityId");
  const level = url.searchParams.get("level");
  const startTime = url.searchParams.get("StartTime");
  const endTime = url.searchParams.get("EndTime");
  const pageSize = Number(url.searchParams.get("PS") ?? url.searchParams.get("pageSize") ?? "100");
  const pageNumber = Number(url.searchParams.get("PN") ?? url.searchParams.get("page") ?? "1");

  let records = alarmData.records;

  if (area) records = records.filter((record) => record.area === area);
  if (moduleName) records = records.filter((record) => record.module === moduleName);
  if (priority) records = records.filter((record) => record.priority === priority);
  if (eventType) records = records.filter((record) => record.eventType === eventType);
  if (entityId) records = records.filter((record) => record.entityId === entityId);
  if (level) records = records.filter((record) => record.level === level);
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
