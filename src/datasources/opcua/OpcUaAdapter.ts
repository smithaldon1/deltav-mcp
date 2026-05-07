import type {
  AlarmsEventsRequest,
  AlarmsEventsResponse,
  AuthStatus,
  BatchEventsRequest,
  BatchEventsResponse,
  DeltaVGraphNode,
  GraphSearchRequest,
  GraphSearchResponse,
  HistoryResponse,
} from "../../deltav/types.js";
import { ValidationError } from "../../utils/errors.js";
import type {
  CurrentValueResult,
  DeltaVDataSourceAdapter,
  HistoryRequest,
  NodeContextOptions,
} from "../DeltaVDataSourceAdapter.js";
import { assertOpcUaAlarmsUnsupported } from "./alarms.js";
import type { OpcUaClient } from "./OpcUaClient.js";

function buildRuntimeValue(read: { readonly value: unknown; readonly statusCode: string; readonly sourceTimestamp?: string }): CurrentValueResult {
  return {
    entityId: "",
    value:
      typeof read.value === "number" ||
      typeof read.value === "string" ||
      typeof read.value === "boolean" ||
      read.value === null
        ? read.value
        : JSON.stringify(read.value),
    quality: read.statusCode,
    ...(read.sourceTimestamp ? { timestamp: read.sourceTimestamp } : {}),
  };
}

export class OpcUaAdapter implements DeltaVDataSourceAdapter {
  readonly kind = "OPCUA" as const;

  constructor(private readonly client: OpcUaClient) {}

  getClient(): OpcUaClient {
    return this.client;
  }

  async authenticate(): Promise<void> {
    await this.client.testConnection();
  }

  getAuthStatus(): AuthStatus {
    return {
      authenticated: false,
      baseUrl: this.client.getEndpointUrl(),
      verifyTls: true,
      tokenCached: false,
      useMock: false,
    };
  }

  async searchHierarchy(input: GraphSearchRequest): Promise<GraphSearchResponse> {
    const results = await this.client.searchMappings(input.query, input.area, input.limit);
    return {
      results: results.map((entry) => ({
        id: entry.logicalId,
        name: entry.logicalId,
        ...(entry.area ? { area: entry.area } : {}),
        ...(entry.entityPath ? { path: entry.entityPath } : {}),
        ...(entry.type ? { type: entry.type } : {}),
        metadata: {
          nodeId: entry.nodeId,
          ...(entry.description ? { description: entry.description } : {}),
          ...(entry.browsePath ? { browsePath: entry.browsePath } : {}),
        },
      })),
    };
  }

  async getNodeContext(entityId: string, _options?: NodeContextOptions): Promise<DeltaVGraphNode> {
    void _options;
    const context = await this.client.getMappedNodeContext(entityId);
    return {
      id: String(context.logicalId),
      name: String(context.logicalId),
      ...(typeof context.area === "string" ? { area: context.area } : {}),
      ...(typeof context.entityPath === "string" ? { path: context.entityPath } : {}),
      type: typeof context.type === "string" ? context.type : "OPCUA_NODE",
      metadata: {
        nodeId: context.nodeId,
        ...(typeof context.description === "string" ? { description: context.description } : {}),
      },
      runtime: {
        value: context.currentValue,
      },
      relationships: {
        references: context.references,
        ...(context.browsePath ? { browsePath: context.browsePath } : {}),
      },
    };
  }

  async readCurrentValue(entityId: string, field?: string): Promise<CurrentValueResult> {
    const logicalId = field ? `${entityId}/${field}` : entityId;
    const read = await this.client.readMappedValue(logicalId);
    return {
      ...buildRuntimeValue(read),
      entityId: logicalId,
      ...(field ? { field } : {}),
    };
  }

  async readCurrentValues(
    requests: readonly { readonly entityId: string; readonly field?: string }[],
  ): Promise<readonly CurrentValueResult[]> {
    return Promise.all(
      requests.map((request) => this.readCurrentValue(request.entityId, request.field)),
    );
  }

  async getHistory(input: HistoryRequest): Promise<HistoryResponse> {
    const start = new Date(input.start);
    const end = new Date(input.end);
    const samples = await this.client.sampleMappedHistory(input.entityId, start, end, input.maxPoints);

    return {
      entityId: input.entityId,
      start: input.start,
      end: input.end,
      values: samples.flatMap((sample) =>
        sample.reads.map((read) => ({
          timestamp: read.sourceTimestamp ?? sample.timestamp,
          value:
            typeof read.value === "number" ||
            typeof read.value === "string" ||
            typeof read.value === "boolean" ||
            read.value === null
              ? read.value
              : JSON.stringify(read.value),
          quality: read.statusCode,
        })),
      ),
    };
  }

  async getAlarmsEvents(_input: AlarmsEventsRequest): Promise<AlarmsEventsResponse> {
    void _input;
    assertOpcUaAlarmsUnsupported();
  }

  async getBatchEvents(_input: BatchEventsRequest): Promise<BatchEventsResponse> {
    void _input;
    throw new ValidationError(
      "Batch event retrieval is not implemented for OPC UA mode. Use EDGE_REST or MOCK_EDGE_REST for batch tools.",
    );
  }

  searchGraph(input: GraphSearchRequest): Promise<GraphSearchResponse> {
    return this.searchHierarchy(input);
  }

  getGraphByEntityId(entityId: string): Promise<DeltaVGraphNode> {
    return this.getNodeContext(entityId);
  }

  getHistoryById(
    entityId: string,
    start: string,
    end: string,
    maxPoints: number,
  ): Promise<HistoryResponse> {
    return this.getHistory({ entityId, start, end, maxPoints });
  }
}
