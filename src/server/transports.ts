import { createServer as createNodeServer, type IncomingMessage, type ServerResponse } from "node:http";
import crypto from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AppConfig } from "../config/env.js";
import type { ToolContext } from "../tools/registerTools.js";
import { createServer } from "./createServer.js";

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return body.length > 0 ? (JSON.parse(body) as unknown) : undefined;
}

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

export async function startStdioTransport(context: ToolContext): Promise<void> {
  const server = createServer(context);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export async function startHttpTransport(
  config: AppConfig,
  context: ToolContext,
): Promise<void> {
  const nodeServer = createNodeServer(async (req, res) => {
    try {
      const method = req.method ?? "GET";
      const url = req.url ?? "/";

      if (url === "/healthz") {
        writeJson(res, 200, {
          status: "ok",
          transport: "streamable-http",
          mode: config.mode,
        });
        return;
      }

      if (url !== config.http.path) {
        writeJson(res, 404, { error: "Not found." });
        return;
      }

      if (method !== "POST") {
        writeJson(res, 405, {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        });
        return;
      }

      const body = await readJsonBody(req);
      const transport = config.http.stateless
        ? new StreamableHTTPServerTransport()
        : new StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
          });
      const server = createServer(context);

      await server.connect(transport as Parameters<typeof server.connect>[0]);
      await transport.handleRequest(req, res, body);

      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      writeJson(res, 500, {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal server error",
        },
        id: null,
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    nodeServer.once("error", reject);
    nodeServer.listen(config.http.port, config.http.host, () => resolve());
  });
}
