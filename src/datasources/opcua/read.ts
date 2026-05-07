import { AttributeIds, DataType, type ClientSession, type DataValue, type NodeIdLike } from "node-opcua";
import type { OpcUaReadResult } from "./types.js";

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

export function dataValueToReadResult(nodeId: string, dataValue: DataValue): OpcUaReadResult {
  const variant = dataValue.value;
  return {
    nodeId,
    value: serializeValue(variant.value),
    dataType: DataType[variant.dataType] ?? null,
    arrayType: variant.arrayType !== undefined ? String(variant.arrayType) : null,
    statusCode: dataValue.statusCode.name,
    ...(dataValue.sourceTimestamp ? { sourceTimestamp: dataValue.sourceTimestamp.toISOString() } : {}),
    ...(dataValue.serverTimestamp ? { serverTimestamp: dataValue.serverTimestamp.toISOString() } : {}),
  };
}

export async function readNodeValue(session: ClientSession, nodeId: NodeIdLike): Promise<OpcUaReadResult> {
  const dataValue = await session.read({
    nodeId,
    attributeId: AttributeIds.Value,
  });
  return dataValueToReadResult(String(nodeId), dataValue);
}

export async function readNodeValues(
  session: ClientSession,
  nodeIds: readonly NodeIdLike[],
): Promise<readonly OpcUaReadResult[]> {
  const dataValues = await session.read(
    nodeIds.map((nodeId) => ({
      nodeId,
      attributeId: AttributeIds.Value,
    })),
  );
  return dataValues.map((dataValue, index) => dataValueToReadResult(String(nodeIds[index]), dataValue));
}
