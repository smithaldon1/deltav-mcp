import path from "node:path";

export interface MockConfig {
  readonly host: string;
  readonly port: number;
  readonly basePath: string;
  readonly developmentAuthMode: boolean;
}

export function getMockConfig(env: NodeJS.ProcessEnv = process.env): MockConfig {
  return {
    host: env.MOCK_DELTAV_EDGE_HOST ?? "0.0.0.0",
    port: Number(env.MOCK_DELTAV_EDGE_PORT ?? "8080"),
    basePath: env.MOCK_DELTAV_EDGE_BASE_PATH ?? "/edge/api/v1",
    developmentAuthMode: (env.MOCK_DELTAV_EDGE_DEV_AUTH ?? "true") === "true",
  };
}

export function dataPath(...parts: string[]): string {
  return path.resolve(process.cwd(), "mock-deltav-edge", "src", "data", ...parts);
}

export function uiDistPath(...parts: string[]): string {
  return path.resolve(process.cwd(), "mock-deltav-edge", "ui", "dist", ...parts);
}
