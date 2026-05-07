export interface AuthTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in?: number;
}

export interface AuthStatus {
  readonly authenticated: boolean;
  readonly baseUrl: string;
  readonly verifyTls: boolean;
  readonly tokenCached: boolean;
  readonly useMock: boolean;
}

export interface GraphSearchRequest {
  readonly query: string | undefined;
  readonly area: string | undefined;
  readonly limit: number;
}

export interface DeltaVGraphNode {
  readonly id: string;
  readonly name: string;
  readonly area?: string;
  readonly path?: string;
  readonly type?: string;
  readonly metadata?: Record<string, unknown>;
  readonly runtime?: Record<string, unknown>;
  readonly relationships?: Record<string, unknown>;
}

export interface GraphSearchResponse {
  readonly results: readonly DeltaVGraphNode[];
}

export interface HistoryPoint {
  readonly timestamp: string;
  readonly value: number | string | boolean | null;
  readonly quality?: string;
}

export interface HistoryResponse {
  readonly entityId: string;
  readonly start: string;
  readonly end: string;
  readonly values: readonly HistoryPoint[];
}

export interface AlarmsEventsRequest {
  readonly start: string;
  readonly end: string;
  readonly area: string | undefined;
  readonly entityId: string | undefined;
  readonly page: number;
  readonly pageSize: number;
}

export interface AlarmEventRecord {
  readonly id: string;
  readonly timestamp: string;
  readonly type?: string;
  readonly module?: string;
  readonly level?: string;
  readonly eventType?: string;
  readonly state?: string;
  readonly priority?: string;
  readonly message: string;
  readonly area?: string;
  readonly entityId?: string;
  readonly source?: string;
  readonly acknowledged?: boolean;
  readonly active?: boolean;
  readonly returnToNormalTime?: string;
}

export interface AlarmsEventsResponse {
  readonly page: number;
  readonly pageSize: number;
  readonly total?: number;
  readonly records: readonly AlarmEventRecord[];
}

export interface BatchEventsRequest {
  readonly start: string;
  readonly end: string;
  readonly recipe: string | undefined;
  readonly batchId: string | undefined;
  readonly unit: string | undefined;
  readonly phase: string | undefined;
  readonly page: number;
  readonly pageSize: number;
}

export interface BatchEventRecord {
  readonly batchId: string;
  readonly recipe: string;
  readonly procedure: string;
  readonly unitProcedure: string;
  readonly operation: string;
  readonly phase: string;
  readonly step: string;
  readonly transition: string;
  readonly timestamp: string;
  readonly eventType: string;
  readonly message: string;
  readonly unit: string;
  readonly status: string;
}

export interface BatchEventsResponse {
  readonly page: number;
  readonly pageSize: number;
  readonly total?: number;
  readonly records: readonly BatchEventRecord[];
}
