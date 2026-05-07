import { AttributeIds, TimestampsToReturn, type ClientSession, type NodeIdLike } from "node-opcua";
import { ValidationError } from "../../utils/errors.js";
import type { OpcUaMonitoringEvent } from "./types.js";

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("base64");
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeValue(item)]),
    );
  }
  return value;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function monitorNodesForWindow(
  session: ClientSession,
  nodeIds: readonly NodeIdLike[],
  durationMs: number,
  samplingIntervalMs: number,
): Promise<readonly OpcUaMonitoringEvent[]> {
  const subscription = await session.createSubscription2({
    requestedPublishingInterval: Math.max(100, samplingIntervalMs),
    requestedLifetimeCount: 100,
    requestedMaxKeepAliveCount: 10,
    maxNotificationsPerPublish: 0,
    publishingEnabled: true,
    priority: 1,
  });

  const events: OpcUaMonitoringEvent[] = [];

  try {
    for (const nodeId of nodeIds) {
      const monitoredItem = await subscription.monitor(
        {
          nodeId,
          attributeId: AttributeIds.Value,
        },
        {
          samplingInterval: Math.max(100, samplingIntervalMs),
          queueSize: 100,
          discardOldest: true,
        },
        TimestampsToReturn.Both,
      );

      monitoredItem.on("changed", (dataValue) => {
        events.push({
          timestamp: new Date().toISOString(),
          nodeId: String(nodeId),
          value: serializeValue(dataValue.value.value),
          dataType: dataValue.value.dataType !== undefined ? String(dataValue.value.dataType) : null,
          statusCode: dataValue.statusCode.name,
          ...(dataValue.sourceTimestamp ? { sourceTimestamp: dataValue.sourceTimestamp.toISOString() } : {}),
          ...(dataValue.serverTimestamp ? { serverTimestamp: dataValue.serverTimestamp.toISOString() } : {}),
        });
      });
    }

    await wait(durationMs);
    return events;
  } catch (error) {
    throw new ValidationError("Failed while monitoring OPC UA nodes.", {
      cause: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await subscription.terminate();
  }
}
