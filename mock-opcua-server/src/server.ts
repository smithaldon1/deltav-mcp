import { fileURLToPath } from "node:url";
import { OPCUAServer, type Namespace, type UAObject } from "node-opcua";
import { getMockOpcUaConfig, type MockOpcUaConfig } from "./config.js";
import { installCipSkid } from "./demoSystems/cipSkid.js";
import { installPumpSkid } from "./demoSystems/pumpSkid.js";
import { installReactorTemperature } from "./demoSystems/reactorTemperature.js";
import { installTankLevelControl } from "./demoSystems/tankLevelControl.js";
import { installUtilityHeader } from "./demoSystems/utilityHeader.js";

function populate(namespace: Namespace, objectsFolder: UAObject): void {
  installPumpSkid(namespace, objectsFolder);
  installReactorTemperature(namespace, objectsFolder);
  installCipSkid(namespace, objectsFolder);
  installTankLevelControl(namespace, objectsFolder);
  installUtilityHeader(namespace, objectsFolder);
}

export async function createMockOpcUaServer(config: MockOpcUaConfig = getMockOpcUaConfig()): Promise<OPCUAServer> {
  const server = new OPCUAServer({
    port: config.port,
    hostname: config.host,
    resourcePath: config.resourcePath,
    buildInfo: {
      productName: "DeltaV Mock OPC UA Server",
      buildNumber: "0.1.0",
      buildDate: new Date("2026-05-07T00:00:00.000Z"),
    },
    allowAnonymous: config.allowAnonymous,
    userManager: {
      isValidUser: (username: string, password: string) =>
        username === config.username && password === config.password,
    },
  });

  await server.initialize();
  const addressSpace = server.engine.addressSpace;
  if (!addressSpace) {
    throw new Error("Failed to initialize OPC UA address space.");
  }
  const namespace = addressSpace.getOwnNamespace();
  populate(namespace, addressSpace.rootFolder.objects);
  return server;
}

export async function startMockOpcUaServer(config: MockOpcUaConfig = getMockOpcUaConfig()): Promise<OPCUAServer> {
  const server = await createMockOpcUaServer(config);
  await server.start();
  return server;
}

const executedPath = process.argv[1];
if (executedPath && fileURLToPath(import.meta.url) === executedPath) {
  const config = getMockOpcUaConfig();
  const server = await startMockOpcUaServer(config);
  const endpoint = server.getEndpointUrl();
  process.stderr.write(`[mock-opcua-server] listening on ${endpoint}\n`);
}
