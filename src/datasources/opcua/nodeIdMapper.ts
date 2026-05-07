import { readFile } from "node:fs/promises";
import { ConfigurationError, ValidationError } from "../../utils/errors.js";
import type { OpcUaNodeMapEntry } from "./types.js";

interface RawNodeMapEntry {
  readonly nodeId?: unknown;
  readonly area?: unknown;
  readonly entityId?: unknown;
  readonly entityPath?: unknown;
  readonly description?: unknown;
  readonly type?: unknown;
  readonly browsePath?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBrowsePath(value: unknown, logicalId: string): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((segment) => typeof segment !== "string" || segment.length === 0)) {
    throw new ValidationError("Invalid OPC UA browsePath entry.", { logicalId });
  }
  return value;
}

function parseEntry(logicalId: string, value: unknown): OpcUaNodeMapEntry {
  if (typeof value === "string") {
    return {
      logicalId,
      nodeId: value,
      entityId: logicalId,
      entityPath: logicalId,
      browsePath: logicalId.split("/"),
      type: "OPCUA_NODE",
    };
  }

  if (!isRecord(value)) {
    throw new ValidationError("Invalid OPC UA node map entry.", { logicalId });
  }

  const raw = value as RawNodeMapEntry;
  if (typeof raw.nodeId !== "string" || raw.nodeId.length === 0) {
    throw new ValidationError("OPC UA node map entries must define nodeId.", { logicalId });
  }
  const browsePath = raw.browsePath !== undefined ? parseBrowsePath(raw.browsePath, logicalId) : undefined;

  return {
    logicalId,
    nodeId: raw.nodeId,
    ...(typeof raw.area === "string" ? { area: raw.area } : {}),
    ...(typeof raw.entityId === "string" ? { entityId: raw.entityId } : { entityId: logicalId }),
    ...(typeof raw.entityPath === "string" ? { entityPath: raw.entityPath } : { entityPath: logicalId }),
    ...(typeof raw.description === "string" ? { description: raw.description } : {}),
    ...(typeof raw.type === "string" ? { type: raw.type } : { type: "OPCUA_NODE" }),
    ...(browsePath ? { browsePath } : {}),
  };
}

export async function loadOpcUaNodeMap(pathname: string): Promise<readonly OpcUaNodeMapEntry[]> {
  try {
    const content = await readFile(pathname, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!isRecord(parsed)) {
      throw new ValidationError("OPC UA node map must be a JSON object.", {
        nodeMapPath: pathname,
      });
    }

    return Object.entries(parsed).map(([logicalId, value]) => parseEntry(logicalId, value));
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ConfigurationError("Failed to load OPC UA node map.", {
      nodeMapPath: pathname,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export class OpcUaNodeIdMapper {
  constructor(private readonly entries: readonly OpcUaNodeMapEntry[]) {}

  static async fromFile(pathname: string): Promise<OpcUaNodeIdMapper> {
    return new OpcUaNodeIdMapper(await loadOpcUaNodeMap(pathname));
  }

  list(): readonly OpcUaNodeMapEntry[] {
    return this.entries;
  }

  findByLogicalId(logicalId: string): OpcUaNodeMapEntry | undefined {
    return this.entries.find((entry) => entry.logicalId === logicalId);
  }

  findByEntityId(entityId: string): OpcUaNodeMapEntry | undefined {
    return this.entries.find(
      (entry) => entry.entityId === entityId || entry.entityPath === entityId || entry.logicalId === entityId,
    );
  }

  resolveNodeId(identifier: string): OpcUaNodeMapEntry {
    const mapped = this.findByLogicalId(identifier) ?? this.findByEntityId(identifier);
    if (mapped) {
      return mapped;
    }
    if (identifier.startsWith("ns=") || identifier.startsWith("i=") || identifier.startsWith("s=")) {
      return {
        logicalId: identifier,
        nodeId: identifier,
        entityId: identifier,
        entityPath: identifier,
        type: "OPCUA_NODE",
      };
    }

    throw new ValidationError("No OPC UA node mapping was found for the requested identifier.", {
      identifier,
    });
  }

  search(query: string | undefined, area: string | undefined, limit: number): readonly OpcUaNodeMapEntry[] {
    const normalizedQuery = query?.trim().toLowerCase();
    return this.entries
      .filter((entry) => {
        if (area && entry.area !== area) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }

        return [
          entry.logicalId,
          entry.nodeId,
          entry.entityId,
          entry.entityPath,
          entry.description,
          entry.type,
          entry.area,
        ]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .slice(0, limit);
  }
}
