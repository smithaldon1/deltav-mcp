import { mkdir } from "node:fs/promises";
import {
  type ClientSession,
  MessageSecurityMode,
  type NodeIdLike,
  OPCUAClient,
  SecurityPolicy,
  type EndpointDescription,
  type UserIdentityInfo,
} from "node-opcua";
import { ConfigurationError, ValidationError } from "../../utils/errors.js";
import { assertTimeRange } from "../../utils/time.js";
import { browseNode, translateBrowsePath } from "./browse.js";
import { sampleNodesForWindow } from "./history.js";
import { OpcUaNodeIdMapper } from "./nodeIdMapper.js";
import { readNodeValue, readNodeValues } from "./read.js";
import { monitorNodesForWindow } from "./subscriptions.js";
import type {
  OpcUaBrowseResult,
  OpcUaEndpointSummary,
  OpcUaNodeMapEntry,
  OpcUaReadResult,
  OpcUaSecurityConfig,
  OpcUaTranslatedPath,
  OpcUaWindowSample,
  OpcUaMonitoringEvent,
} from "./types.js";

const MAX_SAMPLE_WINDOW_HOURS = 24;

function resolveSecurityMode(mode: string): MessageSecurityMode {
  switch (mode) {
    case "None":
      return MessageSecurityMode.None;
    case "Sign":
      return MessageSecurityMode.Sign;
    case "SignAndEncrypt":
      return MessageSecurityMode.SignAndEncrypt;
    default:
      throw new ConfigurationError("Unsupported DELTAV_OPCUA_SECURITY_MODE value.", {
        securityMode: mode,
      });
  }
}

function resolveSecurityPolicy(policy: string): SecurityPolicy {
  switch (policy) {
    case "None":
      return SecurityPolicy.None;
    case "Basic128Rsa15":
      return SecurityPolicy.Basic128Rsa15;
    case "Basic256":
      return SecurityPolicy.Basic256;
    case "Basic256Sha256":
      return SecurityPolicy.Basic256Sha256;
    case "Aes128_Sha256_RsaOaep":
      return SecurityPolicy.Aes128_Sha256_RsaOaep;
    case "Aes256_Sha256_RsaPss":
      return SecurityPolicy.Aes256_Sha256_RsaPss;
    default:
      throw new ConfigurationError("Unsupported DELTAV_OPCUA_SECURITY_POLICY value.", {
        securityPolicy: policy,
      });
  }
}

function summarizeEndpoint(endpoint: EndpointDescription): OpcUaEndpointSummary {
  return {
    endpointUrl: endpoint.endpointUrl ?? "",
    securityMode: MessageSecurityMode[endpoint.securityMode] ?? String(endpoint.securityMode),
    securityPolicyUri: endpoint.securityPolicyUri ?? "",
    securityLevel: endpoint.securityLevel,
    ...(endpoint.transportProfileUri ? { transportProfileUri: endpoint.transportProfileUri } : {}),
    userIdentityTokens: (endpoint.userIdentityTokens ?? []).map((token) => token.tokenType.toString()),
  };
}

export class OpcUaClient {
  private mapperPromise: Promise<OpcUaNodeIdMapper> | undefined;

  constructor(private readonly config: OpcUaSecurityConfig) {}

  getEndpointUrl(): string {
    return this.config.endpointUrl;
  }

  private async getMapper(): Promise<OpcUaNodeIdMapper> {
    this.mapperPromise ??= OpcUaNodeIdMapper.fromFile(this.config.nodeMapPath);
    return this.mapperPromise;
  }

  private getUserIdentity(): UserIdentityInfo | undefined {
    if (!this.config.username) {
      return undefined;
    }
    return {
      type: 1,
      userName: this.config.username,
      password: this.config.password,
    } as UserIdentityInfo;
  }

  private async createClient(): Promise<OPCUAClient> {
    await mkdir(this.config.certDir, { recursive: true });
    return OPCUAClient.create({
      endpointMustExist: false,
      applicationName: this.config.applicationName,
      securityMode: resolveSecurityMode(this.config.securityMode),
      securityPolicy: resolveSecurityPolicy(this.config.securityPolicy),
      requestedSessionTimeout: this.config.sessionTimeoutMs,
      transportTimeout: this.config.requestTimeoutMs,
      keepSessionAlive: false,
      connectionStrategy: {
        initialDelay: 200,
        maxDelay: 1000,
        maxRetry: 1,
      },
    });
  }

  private async withClient<T>(handler: (client: OPCUAClient) => Promise<T>): Promise<T> {
    const client = await this.createClient();
    try {
      await client.connect(this.config.endpointUrl);
      return await handler(client);
    } finally {
      await client.disconnect();
    }
  }

  private async withSession<T>(handler: (session: ClientSession) => Promise<T>): Promise<T> {
    return this.withClient(async (client) => {
      const session = this.getUserIdentity()
        ? await client.createSession(this.getUserIdentity())
        : await client.createSession();
      try {
        return await handler(session);
      } finally {
        await session.close();
      }
    });
  }

  private async resolveMappedNode(identifier: string): Promise<OpcUaNodeMapEntry> {
    const mapper = await this.getMapper();
    return mapper.resolveNodeId(identifier);
  }

  async assertAvailable(): Promise<void> {
    await this.testConnection();
  }

  async discoverEndpoints(): Promise<readonly OpcUaEndpointSummary[]> {
    return this.withClient(async (client) => {
      const endpoints = await client.getEndpoints();
      return endpoints.map((endpoint) => summarizeEndpoint(endpoint));
    });
  }

  async testConnection(): Promise<{ readonly endpointUrl: string; readonly authenticated: boolean }> {
    return this.withSession(async () => ({
      endpointUrl: this.config.endpointUrl,
      authenticated: true,
    }));
  }

  async getNamespaceArray(): Promise<readonly string[]> {
    return this.withSession(async (session) => session.readNamespaceArray());
  }

  async getServerStatus(): Promise<Record<string, unknown>> {
    return this.withSession(async (session) => {
      const result = await readNodeValue(session, "i=2256");
      return {
        endpointUrl: this.config.endpointUrl,
        serverStatus: result,
      };
    });
  }

  async browseNode(nodeId: string): Promise<OpcUaBrowseResult> {
    return this.withSession(async (session) => browseNode(session, nodeId));
  }

  async readNode(nodeId: string): Promise<OpcUaReadResult> {
    return this.withSession(async (session) => readNodeValue(session, nodeId));
  }

  async readNodes(nodeIds: readonly string[]): Promise<readonly OpcUaReadResult[]> {
    if (nodeIds.length > this.config.maxNodesPerRead) {
      throw new ValidationError("Requested node count exceeds DELTAV_OPCUA_MAX_NODES_PER_READ.", {
        requestedNodes: nodeIds.length,
        maxNodesPerRead: this.config.maxNodesPerRead,
      });
    }
    return this.withSession(async (session) => readNodeValues(session, nodeIds));
  }

  async translatePath(startingNodeId: string, browsePath: string): Promise<OpcUaTranslatedPath> {
    return this.withSession(async (session) => translateBrowsePath(session, startingNodeId, browsePath));
  }

  async sampleNodesForWindow(
    nodeIds: readonly string[],
    startTime: Date,
    endTime: Date,
    maxPoints: number,
  ): Promise<readonly OpcUaWindowSample[]> {
    assertTimeRange(startTime, endTime, MAX_SAMPLE_WINDOW_HOURS);
    if (nodeIds.length > this.config.maxNodesPerRead) {
      throw new ValidationError("Requested node count exceeds DELTAV_OPCUA_MAX_NODES_PER_READ.", {
        requestedNodes: nodeIds.length,
        maxNodesPerRead: this.config.maxNodesPerRead,
      });
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    const intervalMs = Math.max(100, Math.floor(durationMs / Math.max(maxPoints - 1, 1)));
    return this.withSession(async (session) =>
      sampleNodesForWindow(session, nodeIds as readonly NodeIdLike[], durationMs, intervalMs),
    );
  }

  async monitorNodesForWindow(
    nodeIds: readonly string[],
    durationMs: number,
    samplingIntervalMs: number,
  ): Promise<readonly OpcUaMonitoringEvent[]> {
    if (!this.config.enableSubscriptions) {
      throw new ValidationError(
        "OPC UA subscriptions are disabled. Set DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS=true to use monitoring tools.",
      );
    }
    if (nodeIds.length > this.config.maxNodesPerRead) {
      throw new ValidationError("Requested node count exceeds DELTAV_OPCUA_MAX_NODES_PER_READ.", {
        requestedNodes: nodeIds.length,
        maxNodesPerRead: this.config.maxNodesPerRead,
      });
    }

    return this.withSession(async (session) =>
      monitorNodesForWindow(session, nodeIds as readonly NodeIdLike[], durationMs, samplingIntervalMs),
    );
  }

  async searchMappings(
    query: string | undefined,
    area: string | undefined,
    limit: number,
  ): Promise<readonly OpcUaNodeMapEntry[]> {
    const mapper = await this.getMapper();
    return mapper.search(query, area, limit);
  }

  async getMappedNodeContext(identifier: string): Promise<Record<string, unknown>> {
    const mapping = await this.resolveMappedNode(identifier);
    const [read, browse] = await Promise.all([this.readNode(mapping.nodeId), this.browseNode(mapping.nodeId)]);
    return {
      logicalId: mapping.logicalId,
      nodeId: mapping.nodeId,
      area: mapping.area,
      entityId: mapping.entityId,
      entityPath: mapping.entityPath,
      description: mapping.description,
      type: mapping.type,
      browsePath: mapping.browsePath,
      currentValue: read,
      references: browse.references,
    };
  }

  async readMappedValue(identifier: string): Promise<OpcUaReadResult> {
    const mapping = await this.resolveMappedNode(identifier);
    return this.readNode(mapping.nodeId);
  }

  async readMappedValues(identifiers: readonly string[]): Promise<readonly OpcUaReadResult[]> {
    const mappings = await Promise.all(identifiers.map((identifier) => this.resolveMappedNode(identifier)));
    return this.readNodes(mappings.map((mapping) => mapping.nodeId));
  }

  async sampleMappedHistory(
    identifier: string,
    startTime: Date,
    endTime: Date,
    maxPoints: number,
  ): Promise<readonly OpcUaWindowSample[]> {
    const mapping = await this.resolveMappedNode(identifier);
    return this.sampleNodesForWindow([mapping.nodeId], startTime, endTime, maxPoints);
  }
}
