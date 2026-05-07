import { afterEach, describe, expect, it } from "vitest";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

const children: ChildProcessWithoutNullStreams[] = [];

afterEach(async () => {
  await Promise.all(
    children.splice(0).map(
      (child) =>
        new Promise<void>((resolve) => {
          child.once("exit", () => resolve());
          child.kill("SIGTERM");
          setTimeout(() => {
            if (!child.killed) {
              child.kill("SIGKILL");
            }
          }, 1000);
        }),
    ),
  );
});

async function readUntil(
  child: ChildProcessWithoutNullStreams,
  predicate: (payload: Record<string, unknown>) => boolean,
): Promise<Record<string, unknown>> {
  return await new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for stdio response. Output=${chunks.join("")}`));
    }, 8000);

    const onData = (buffer: Buffer) => {
      chunks.push(buffer.toString("utf8"));
      const joined = chunks.join("");
      const frames = joined.split("\n").filter((line) => line.trim().startsWith("{"));
      for (const frame of frames) {
        try {
          const payload = JSON.parse(frame) as Record<string, unknown>;
          if (predicate(payload)) {
            clearTimeout(timer);
            child.stdout.off("data", onData);
            resolve(payload);
            return;
          }
        } catch {
          // ignore partial frames
        }
      }
    };

    child.stdout.on("data", onData);
  });
}

function startServer(): ChildProcessWithoutNullStreams {
  const child = spawn("node", ["dist/index.js", "--transport", "stdio"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DELTAV_DATA_SOURCE: "MOCK_EDGE_REST",
      DELTAV_EDGE_BASE_URL: "http://localhost:8080/edge/",
      DELTAV_EDGE_USERNAME: "demo",
      DELTAV_EDGE_PASSWORD: "demo",
      DELTAV_EDGE_VERIFY_TLS: "false",
      DELTAV_USE_MOCK: "true",
      DELTAV_MCP_MODE: "READ_ONLY",
      DELTAV_AUDIT_LOG_PATH: "./logs/audit.log",
      DELTAV_PACKAGE_OUTPUT_DIR: "./generated-packages",
      DELTAV_EDGE_ENDPOINT_AUTH_TOKEN: "/api/v1/Login/GetAuthToken/profile",
      DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION: "/api/v1/graph",
      DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY: "/api/v1/graph/{entityId}",
      DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION: "/api/v1/history",
      DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID: "/api/v1/history/{entityId}",
      DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS: "/api/v1/ae",
      DELTAV_EDGE_ENDPOINT_BATCH_EVENTS: "/api/v1/batchevent",
      DELTAV_HTTP_ENABLED: "false",
    },
    stdio: "pipe",
  });
  children.push(child);
  return child;
}

describe("stdio MCP discovery", () => {
  it("lists the expected minimum tools over stdio", async () => {
    const child = startServer();
    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "vitest", version: "1.0.0" },
        },
      })}\n`,
    );
    await readUntil(child, (payload) => payload.id === 1);

    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      })}\n`,
    );
    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      })}\n`,
    );
    const response = await readUntil(child, (payload) => payload.id === 2);
    const result = response.result as { tools?: Array<{ name?: string }> } | undefined;
    const toolNames = new Set((result?.tools ?? []).map((tool) => tool.name));

    expect(toolNames.has("deltav_auth_status")).toBe(true);
    expect(toolNames.has("deltav_search_graph")).toBe(true);
    expect(toolNames.has("deltav_get_node_context")).toBe(true);
    expect(toolNames.has("deltav_get_history")).toBe(true);
    expect(toolNames.has("deltav_get_alarms_events")).toBe(true);
  });

  it("does not print startup banners to stdout before MCP frames", async () => {
    const child = startServer();
    const unexpectedOutput = await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => {
        child.stdout.off("data", onData);
        resolve(null);
      }, 250);

      const onData = (buffer: Buffer) => {
        clearTimeout(timer);
        child.stdout.off("data", onData);
        resolve(buffer.toString("utf8"));
      };

      child.stdout.on("data", onData);
    });

    expect(unexpectedOutput).toBeNull();

    child.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "vitest", version: "1.0.0" },
        },
      })}\n`,
    );
    const firstFrame = await readUntil(child, (payload) => payload.id === 1);
    expect(firstFrame.jsonrpc).toBe("2.0");
  });
});
