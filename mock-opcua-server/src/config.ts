export interface MockOpcUaConfig {
  readonly host: string;
  readonly port: number;
  readonly resourcePath: string;
  readonly allowAnonymous: boolean;
  readonly username: string;
  readonly password: string;
}

export function getMockOpcUaConfig(env: NodeJS.ProcessEnv = process.env): MockOpcUaConfig {
  return {
    host: env.MOCK_OPCUA_HOST ?? "0.0.0.0",
    port: Number(env.MOCK_OPCUA_PORT ?? "4840"),
    resourcePath: env.MOCK_OPCUA_RESOURCE_PATH ?? "/UA/DeltaVMock",
    allowAnonymous: (env.MOCK_OPCUA_ALLOW_ANONYMOUS ?? "true").toLowerCase() === "true",
    username: env.MOCK_OPCUA_USERNAME ?? "demo",
    password: env.MOCK_OPCUA_PASSWORD ?? "demo",
  };
}
