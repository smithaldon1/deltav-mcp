import { createServer, type Server } from "node:http";
import { describe, expect, it } from "vitest";
import { startMockFixture } from "../helpers/mockServer.js";

describe("mock DeltaV Edge API", () => {
  it("serves the web UI home page and built static assets", async () => {
    const { baseUrl } = await startMockFixture();
    const rootResponse = await fetch(baseUrl.replace("/edge/", "/"));
    const html = await rootResponse.text();
    const assetMatch = html.match(/src="([^"]+assets[^"]+\.js)"/);

    expect(rootResponse.status).toBe(200);
    expect(html).toContain("Mock DeltaV Edge UI");
    expect(assetMatch).not.toBeNull();

    const assetResponse = await fetch(`${baseUrl.replace("/edge/", "")}${assetMatch?.[1] ?? ""}`);
    expect(assetResponse.status).toBe(200);
  });

  it("serves the health endpoint", async () => {
    const { baseUrl } = await startMockFixture();
    const response = await fetch(baseUrl.replace("/edge/", "/health"));
    expect(response.status).toBe(200);
  });

  it("returns an auth token", async () => {
    const { baseUrl } = await startMockFixture();
    const response = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, {
      method: "POST",
      body: new URLSearchParams({ username: "demo", password: "demo" }),
    });
    const payload = await response.json();
    expect(payload.access_token).toContain("mock-token:");
  });

  it("rejects invalid tokens", async () => {
    const { baseUrl } = await startMockFixture();
    const response = await fetch(`${baseUrl}api/v1/graph`, {
      headers: {
        authorization: "Bearer invalid-token",
      },
    });
    expect(response.status).toBe(401);
  });

  it("supports graph lookup by id and path", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const byId = await fetch(`${baseUrl}api/v1/graph/PID-101?p=PV,SP`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    const byPath = await fetch(
      `${baseUrl}api/v1/graph?path=DemoDeltaVSystem/AREA_A/UNIT_100/PID-101`,
      {
        headers: { authorization: `Bearer ${access_token}` },
      },
    );
    expect((await byId.json()).id).toBe("PID-101");
    expect((await byPath.json()).results).toHaveLength(1);
  });

  it("serves metadata used by the UI hierarchy and explorer views", async () => {
    const { baseUrl } = await startMockFixture();
    const statusResponse = await fetch(`${baseUrl.replace("/edge/", "")}/api/mock-ui/status`);
    const statusPayload = await statusResponse.json();
    const graphAuth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await graphAuth.json();
    const graphResponse = await fetch(`${baseUrl}api/v1/graph`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    const graphPayload = await graphResponse.json();

    expect(statusPayload.uiEnabled).toBe(true);
    expect(statusPayload.endpoints).toContain("GET /edge/api/v1/graph");
    expect(statusPayload.mcpToolsListPath).toBe("/api/mcp/rest/tools/list");
    expect(statusPayload.mcpToolCallPath).toBe("/api/mcp/rest/tools/call");
    expect(statusPayload.mcpRestToolsListPath).toBe("/api/mcp/rest/tools/list");
    expect(statusPayload.mcpOpcUaToolsListPath).toBe("/api/mcp/opcua/tools/list");
    expect(statusPayload.mockOpcUaEndpoint).toContain("opc.tcp://");
    expect(graphPayload.results.length).toBeGreaterThan(0);
  });

  it("returns OPC UA presets for the console workbench", async () => {
    const { baseUrl } = await startMockFixture({
      mockOpcUaEndpoint: "opc.tcp://127.0.0.1:4840/UA/TestMock",
    });
    const response = await fetch(`${baseUrl.replace("/edge/", "")}/api/mock-ui/opcua-presets`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.endpoint).toBe("opc.tcp://127.0.0.1:4840/UA/TestMock");
    expect(payload.presets.length).toBeGreaterThan(0);
    expect(payload.presets[0]).toMatchObject({
      logicalId: expect.any(String),
      nodeId: expect.stringContaining("ns="),
      browsePath: expect.stringContaining("/Objects/"),
    });
  });

  it("proxies tools/list and tools/call to the MCP HTTP endpoint", async () => {
    const fakeMcpServer = await new Promise<Server>((resolve) => {
      const server = createServer((req, res) => {
        if (req.url !== "/mcp" || req.method !== "POST") {
          res.writeHead(404).end();
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        req.on("end", () => {
          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
            id: number;
            method: string;
            params?: { name?: string };
          };

          res.writeHead(200, { "content-type": "text/event-stream" });
          if (payload.method === "tools/list") {
            res.end(
              `event: message\ndata: ${JSON.stringify({
                jsonrpc: "2.0",
                id: payload.id,
                result: {
                  tools: [{ name: "opcua_test_connection", description: "Test OPC UA connection." }],
                },
              })}\n\n`,
            );
            return;
          }

          if (payload.method === "tools/call") {
            res.end(
              `event: message\ndata: ${JSON.stringify({
                jsonrpc: "2.0",
                id: payload.id,
                result: {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify({
                        allowed: true,
                        tool: payload.params?.name ?? "unknown",
                      }),
                    },
                  ],
                },
              })}\n\n`,
            );
            return;
          }

          res.end(
            `event: message\ndata: ${JSON.stringify({
              jsonrpc: "2.0",
              id: payload.id,
              error: { code: -32601, message: "Unknown method" },
            })}\n\n`,
          );
        });
      });

      server.listen(0, "127.0.0.1", () => resolve(server));
    });

    try {
      const address = fakeMcpServer.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to resolve fake MCP server address.");
      }

      const { baseUrl } = await startMockFixture({
        mcpRestBaseUrl: `http://127.0.0.1:${address.port}/mcp`,
        mcpOpcUaBaseUrl: `http://127.0.0.1:${address.port}/mcp`,
      });

      const toolsResponse = await fetch(`${baseUrl.replace("/edge/", "")}/api/mcp/tools/list`);
      const toolsPayload = await toolsResponse.json();
      expect(toolsResponse.status).toBe(200);
      expect(toolsPayload.tools).toEqual([
        { name: "opcua_test_connection", description: "Test OPC UA connection.", target: "opcua" },
      ]);

      const callResponse = await fetch(`${baseUrl.replace("/edge/", "")}/api/mcp/tools/call`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "opcua_test_connection",
          arguments: {},
        }),
      });
      const callPayload = await callResponse.json();

      expect(callResponse.status).toBe(200);
      expect(callPayload.name).toBe("opcua_test_connection");
      expect(callPayload.target).toBe("opcua");
      expect(callPayload.isError).toBe(false);
      expect(callPayload.result).toEqual({
        allowed: true,
        tool: "opcua_test_connection",
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        fakeMcpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("supports history query and aggregation", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const response = await fetch(
      `${baseUrl}api/v1/history/PID1%2FPV?StartTime=2026-05-06T11:00:00.000Z&EndTime=2026-05-06T12:00:00.000Z&PS=10&Aggregation=Average`,
      {
        headers: { authorization: `Bearer ${access_token}` },
      },
    );
    const payload = await response.json();
    expect(payload.values).toHaveLength(10);
    expect(payload.aggregateValue).not.toBeNull();
  });

  it("filters alarms/events and batch events with pagination", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const alarms = await fetch(`${baseUrl}api/v1/ae?area=AREA_A&PS=2&PN=1`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    const batches = await fetch(`${baseUrl}api/v1/batchevent?recipe=RECIPE_A&PS=2&PN=1`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    expect((await alarms.json()).pageSize).toBe(2);
    expect((await batches.json()).records.length).toBeGreaterThan(0);
  });

  it("supports error simulation and malformed responses", async () => {
    const { baseUrl } = await startMockFixture();
    const auth = await fetch(`${baseUrl}api/v1/Login/GetAuthToken/profile`, { method: "POST" });
    const { access_token } = await auth.json();
    const errorResponse = await fetch(`${baseUrl}api/v1/graph`, {
      headers: {
        authorization: `Bearer ${access_token}`,
        "x-mock-error": "500",
      },
    });
    const malformedResponse = await fetch(`${baseUrl}api/v1/graph`, {
      headers: {
        authorization: `Bearer ${access_token}`,
        "x-mock-malformed": "true",
      },
    });
    expect(errorResponse.status).toBe(500);
    expect(await malformedResponse.text()).toContain("{ malformed");
  });
});
