import type { AppConfig } from "../config/env.js";

export interface DeltaVEndpointMap {
  readonly authToken: string;
  readonly graphEntity: string;
  readonly graphSearch: string;
  readonly historyCollection: string;
  readonly historyById: string;
  readonly alarmsEvents: string;
  readonly batchEvents: string;
}

// Confirm these paths against the installed DeltaV Edge REST API documentation.
export const defaultEndpoints: DeltaVEndpointMap = {
  authToken: "/connect/token",
  graphEntity: "/api/graph/entities/{entityId}",
  graphSearch: "/api/graph/search",
  historyCollection: "/api/history",
  historyById: "/api/history/{entityId}",
  alarmsEvents: "/api/ae",
  batchEvents: "/api/batchevent",
};

// Confirm these paths against the installed DeltaV Edge REST API documentation.
export const mockEndpoints: DeltaVEndpointMap = {
  authToken: "/api/v1/Login/GetAuthToken/profile",
  graphEntity: "/api/v1/graph/{entityId}",
  graphSearch: "/api/v1/graph",
  historyCollection: "/api/v1/history",
  historyById: "/api/v1/history/{entityId}",
  alarmsEvents: "/api/v1/ae",
  batchEvents: "/api/v1/batchevent",
};

export function resolveEndpoints(config: AppConfig): DeltaVEndpointMap {
  const defaults = config.useMock ? mockEndpoints : defaultEndpoints;

  return {
    authToken: config.endpoints.authToken || defaults.authToken,
    graphEntity: config.endpoints.graphEntity || defaults.graphEntity,
    graphSearch: config.endpoints.graphCollection || defaults.graphSearch,
    historyCollection: config.endpoints.historyCollection || defaults.historyCollection,
    historyById: config.endpoints.historyById || defaults.historyById,
    alarmsEvents: config.endpoints.alarmsEvents || defaults.alarmsEvents,
    batchEvents: config.endpoints.batchEvents || defaults.batchEvents,
  };
}
