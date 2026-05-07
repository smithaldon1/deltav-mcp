import type { AppConfig } from "../config/env.js";
import { DeltaVEdgeClient } from "../deltav/DeltaVEdgeClient.js";
import { ConfigurationError } from "../utils/errors.js";
import type { DeltaVDataSourceAdapter } from "./DeltaVDataSourceAdapter.js";
import { EdgeRestAdapter } from "./edge/EdgeRestAdapter.js";
import { MockEdgeAdapter } from "./mock/MockEdgeAdapter.js";
import { OpcUaAdapter } from "./opcua/OpcUaAdapter.js";
import { OpcUaClient } from "./opcua/OpcUaClient.js";

export function createDataSourceAdapter(config: AppConfig): DeltaVDataSourceAdapter {
  switch (config.dataSource) {
    case "EDGE_REST":
      return new EdgeRestAdapter(new DeltaVEdgeClient(config));
    case "MOCK_EDGE_REST":
      return new MockEdgeAdapter(new DeltaVEdgeClient(config));
    case "OPCUA":
      return new OpcUaAdapter(new OpcUaClient(config.opcua));
    default:
      throw new ConfigurationError("Unsupported DELTAV_DATA_SOURCE value.", {
        dataSource: config.dataSource,
      });
  }
}
