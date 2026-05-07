import type { Dispatcher } from "undici";
import { Agent } from "undici";
import type { AppConfig } from "../config/env.js";
import { DeltaVClientError } from "../utils/errors.js";
import { buildAlarmsEventsQuery } from "./alarmsEvents.js";
import { buildAuthRequestBody } from "./auth.js";
import { buildBatchEventsQuery } from "./batchEvents.js";
import { resolveEndpoints, type DeltaVEndpointMap } from "./endpoints.js";
import { buildGraphSearchQuery } from "./graph.js";
import { buildHistoryQuery } from "./history.js";
import type {
  AlarmsEventsRequest,
  AlarmsEventsResponse,
  AuthStatus,
  AuthTokenResponse,
  BatchEventsRequest,
  BatchEventsResponse,
  DeltaVGraphNode,
  GraphSearchRequest,
  GraphSearchResponse,
  HistoryResponse,
} from "./types.js";

export interface DeltaVEdgeClientOptions {
  readonly fetchImpl?: typeof fetch;
  readonly requestTimeoutMs?: number;
}

export class DeltaVEdgeClient {
  private readonly fetchImpl: typeof fetch;
  private readonly requestTimeoutMs: number;
  private readonly dispatcher: Dispatcher | undefined;
  private readonly endpoints: DeltaVEndpointMap;
  private accessToken: string | null = null;

  constructor(
    private readonly config: AppConfig,
    options: DeltaVEdgeClientOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
    this.endpoints = resolveEndpoints(config);
    this.dispatcher = config.verifyTls
      ? undefined
      : new Agent({
          connect: {
            rejectUnauthorized: false,
          },
        });
  }

  async authenticate(forceRefresh = false): Promise<void> {
    if (this.accessToken && !forceRefresh) {
      return;
    }

    const response = await this.request<AuthTokenResponse>(this.endpoints.authToken, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: buildAuthRequestBody(this.config),
      authenticated: false,
    });

    if (!response.access_token) {
      throw new DeltaVClientError("DeltaV Edge authentication did not return an access token.");
    }

    this.accessToken = response.access_token;
  }

  getAuthStatus(): AuthStatus {
    return {
      authenticated: this.accessToken !== null,
      baseUrl: this.config.baseUrl,
      verifyTls: this.config.verifyTls,
      tokenCached: this.accessToken !== null,
      useMock: this.config.useMock,
    };
  }

  async searchGraph(input: GraphSearchRequest): Promise<GraphSearchResponse> {
    const query = buildGraphSearchQuery(input);
    return this.request<GraphSearchResponse>(`${this.endpoints.graphSearch}?${query.toString()}`);
  }

  async getGraphByEntityId(entityId: string): Promise<DeltaVGraphNode> {
    const route = this.endpoints.graphEntity.replace("{entityId}", encodeURIComponent(entityId));
    return this.request<DeltaVGraphNode>(route);
  }

  async getHistoryById(
    entityId: string,
    start: string,
    end: string,
    maxPoints: number,
  ): Promise<HistoryResponse> {
    const route = this.endpoints.historyById.replace("{entityId}", encodeURIComponent(entityId));
    const query = buildHistoryQuery(start, end, maxPoints, this.config.useMock);
    return this.request<HistoryResponse>(`${route}?${query.toString()}`);
  }

  async getAlarmsEvents(input: AlarmsEventsRequest): Promise<AlarmsEventsResponse> {
    const query = buildAlarmsEventsQuery(input, this.config.useMock);
    return this.request<AlarmsEventsResponse>(`${this.endpoints.alarmsEvents}?${query.toString()}`);
  }

  async getBatchEvents(input: BatchEventsRequest): Promise<BatchEventsResponse> {
    const query = buildBatchEventsQuery(input, this.config.useMock);
    return this.request<BatchEventsResponse>(`${this.endpoints.batchEvents}?${query.toString()}`);
  }

  private async request<T>(
    route: string,
    options: {
      readonly method?: string;
      readonly headers?: Record<string, string>;
      readonly body?: BodyInit | URLSearchParams;
      readonly authenticated?: boolean;
    } = {},
  ): Promise<T> {
    if (options.authenticated !== false) {
      await this.authenticate();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(`${this.config.baseUrl}${route}`, {
        method: options.method ?? "GET",
        headers: {
          accept: "application/json",
          ...(this.accessToken ? { authorization: `Bearer ${this.accessToken}` } : {}),
          ...options.headers,
        },
        body: options.body,
        signal: controller.signal,
        ...(this.dispatcher ? { dispatcher: this.dispatcher } : {}),
      } as RequestInit & { dispatcher?: Dispatcher });

      if (!response.ok) {
        const bodyText = await response.text();
        throw new DeltaVClientError("DeltaV Edge request failed.", {
          status: response.status,
          route,
          bodyText: bodyText.slice(0, 500),
        });
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof DeltaVClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new DeltaVClientError("DeltaV Edge request timed out.", { route });
      }

      throw new DeltaVClientError("DeltaV Edge request failed unexpectedly.", {
        route,
        cause: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
