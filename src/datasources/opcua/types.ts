export type OpcUaSecurityMode = "None" | "Sign" | "SignAndEncrypt";

export type OpcUaSecurityPolicy =
  | "None"
  | "Basic128Rsa15"
  | "Basic256"
  | "Basic256Sha256"
  | "Aes128_Sha256_RsaOaep"
  | "Aes256_Sha256_RsaPss";

export interface OpcUaSecurityConfig {
  readonly endpointUrl: string;
  readonly securityMode: string;
  readonly securityPolicy: string;
  readonly username: string;
  readonly password: string;
  readonly applicationName: string;
  readonly certDir: string;
  readonly trustUnknownCertificates: boolean;
  readonly sessionTimeoutMs: number;
  readonly requestTimeoutMs: number;
  readonly maxNodesPerRead: number;
  readonly enableSubscriptions: boolean;
  readonly enableWrites: boolean;
  readonly nodeMapPath: string;
}

export interface OpcUaNodeMapEntry {
  readonly logicalId: string;
  readonly nodeId: string;
  readonly area?: string;
  readonly entityId?: string;
  readonly entityPath?: string;
  readonly description?: string;
  readonly type?: string;
  readonly browsePath?: readonly string[];
}

export interface OpcUaEndpointSummary {
  readonly endpointUrl: string;
  readonly securityMode: string;
  readonly securityPolicyUri: string;
  readonly securityLevel: number;
  readonly transportProfileUri?: string;
  readonly userIdentityTokens: readonly string[];
}

export interface OpcUaReadResult {
  readonly nodeId: string;
  readonly value: unknown;
  readonly dataType: string | null;
  readonly arrayType: string | null;
  readonly statusCode: string;
  readonly sourceTimestamp?: string;
  readonly serverTimestamp?: string;
}

export interface OpcUaBrowseReference {
  readonly referenceTypeId: string;
  readonly browseName: string;
  readonly displayName: string;
  readonly nodeId: string;
  readonly nodeClass: string;
  readonly typeDefinition?: string;
  readonly isForward: boolean;
}

export interface OpcUaBrowseResult {
  readonly nodeId: string;
  readonly references: readonly OpcUaBrowseReference[];
}

export interface OpcUaTranslatedPath {
  readonly startingNodeId: string;
  readonly browsePath: string;
  readonly targets: readonly string[];
}

export interface OpcUaWindowSample {
  readonly timestamp: string;
  readonly reads: readonly OpcUaReadResult[];
}

export interface OpcUaMonitoringEvent {
  readonly timestamp: string;
  readonly nodeId: string;
  readonly value: unknown;
  readonly dataType: string | null;
  readonly statusCode: string;
  readonly sourceTimestamp?: string;
  readonly serverTimestamp?: string;
}
