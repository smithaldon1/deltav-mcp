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
} from "../deltav/types.js";

export type DeltaVDataSourceKind = "EDGE_REST" | "MOCK_EDGE_REST" | "OPCUA";

export interface NodeContextOptions {
  readonly includeRelationships?: boolean;
  readonly includeProperties?: boolean;
}

export interface HistoryRequest {
  readonly entityId: string;
  readonly start: string;
  readonly end: string;
  readonly maxPoints: number;
  readonly aggregation?: string;
}

export interface CurrentValueResult {
  readonly entityId: string;
  readonly field?: string;
  readonly value: number | string | boolean | null;
  readonly quality?: string;
  readonly timestamp?: string;
}

export interface DeltaVDataSourceAdapter {
  readonly kind: DeltaVDataSourceKind;
  authenticate(forceRefresh?: boolean): Promise<void>;
  getAuthStatus(): AuthStatus;
  searchHierarchy(input: GraphSearchRequest): Promise<GraphSearchResponse>;
  getNodeContext(entityId: string, options?: NodeContextOptions): Promise<DeltaVGraphNode>;
  readCurrentValue(entityId: string, field?: string): Promise<CurrentValueResult>;
  readCurrentValues(
    requests: readonly { readonly entityId: string; readonly field?: string }[],
  ): Promise<readonly CurrentValueResult[]>;
  getHistory(input: HistoryRequest): Promise<HistoryResponse>;
  getAlarmsEvents(input: AlarmsEventsRequest): Promise<AlarmsEventsResponse>;
  getBatchEvents(input: BatchEventsRequest): Promise<BatchEventsResponse>;

  // Compatibility helpers so existing tool logic can migrate incrementally.
  searchGraph(input: GraphSearchRequest): Promise<GraphSearchResponse>;
  getGraphByEntityId(entityId: string): Promise<DeltaVGraphNode>;
  getHistoryById(
    entityId: string,
    start: string,
    end: string,
    maxPoints: number,
  ): Promise<HistoryResponse>;
}
