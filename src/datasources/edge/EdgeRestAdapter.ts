import { ValidationError } from "../../utils/errors.js";
import type { DeltaVEdgeClient } from "../../deltav/DeltaVEdgeClient.js";
import type { DeltaVGraphNode } from "../../deltav/types.js";
import type {
  CurrentValueResult,
  DeltaVDataSourceKind,
  DeltaVDataSourceAdapter,
  HistoryRequest,
  NodeContextOptions,
} from "../DeltaVDataSourceAdapter.js";

function buildCurrentValue(node: DeltaVGraphNode, field?: string): CurrentValueResult {
  if (!field) {
    return {
      entityId: node.id,
      value: null,
    };
  }

  const runtime = node.runtime ?? {};
  const rawValue = runtime[field];

  return {
    entityId: node.id,
    field,
    value:
      typeof rawValue === "number" ||
      typeof rawValue === "string" ||
      typeof rawValue === "boolean" ||
      rawValue === null
        ? rawValue
        : null,
    ...(typeof runtime.QUALITY === "string" ? { quality: runtime.QUALITY } : {}),
  };
}

export class EdgeRestAdapter implements DeltaVDataSourceAdapter {
  readonly kind: DeltaVDataSourceKind = "EDGE_REST";

  constructor(private readonly client: DeltaVEdgeClient) {}

  authenticate(forceRefresh?: boolean): Promise<void> {
    return this.client.authenticate(forceRefresh);
  }

  getAuthStatus() {
    return this.client.getAuthStatus();
  }

  searchHierarchy(input: Parameters<DeltaVEdgeClient["searchGraph"]>[0]) {
    return this.client.searchGraph(input);
  }

  getNodeContext(entityId: string, _options?: NodeContextOptions): Promise<DeltaVGraphNode> {
    void _options;
    return this.client.getGraphByEntityId(entityId);
  }

  async readCurrentValue(entityId: string, field?: string): Promise<CurrentValueResult> {
    const node = await this.client.getGraphByEntityId(entityId);
    return buildCurrentValue(node, field);
  }

  async readCurrentValues(
    requests: readonly { readonly entityId: string; readonly field?: string }[],
  ) {
    return Promise.all(
      requests.map((request) => this.readCurrentValue(request.entityId, request.field)),
    );
  }

  async getHistory(input: HistoryRequest) {
    if (input.aggregation) {
      throw new ValidationError(
        "Aggregation selection is not yet implemented in the REST adapter. Use the configured DeltaV endpoint defaults or mock API query options.",
        { aggregation: input.aggregation },
      );
    }

    return this.client.getHistoryById(
      input.entityId,
      input.start,
      input.end,
      input.maxPoints,
    );
  }

  getAlarmsEvents(input: Parameters<DeltaVEdgeClient["getAlarmsEvents"]>[0]) {
    return this.client.getAlarmsEvents(input);
  }

  getBatchEvents(input: Parameters<DeltaVEdgeClient["getBatchEvents"]>[0]) {
    return this.client.getBatchEvents(input);
  }

  searchGraph(input: Parameters<DeltaVEdgeClient["searchGraph"]>[0]) {
    return this.client.searchGraph(input);
  }

  getGraphByEntityId(entityId: string) {
    return this.client.getGraphByEntityId(entityId);
  }

  getHistoryById(entityId: string, start: string, end: string, maxPoints: number) {
    return this.client.getHistoryById(entityId, start, end, maxPoints);
  }
}
