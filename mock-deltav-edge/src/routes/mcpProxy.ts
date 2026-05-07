import type { IncomingMessage, ServerResponse } from "node:http";
import { MockHttpError } from "../utils/errors.js";
import type { MockConfig } from "../config.js";

export type McpTarget = "rest" | "opcua";

interface JsonRpcEnvelope {
  readonly jsonrpc: "2.0";
  readonly id: number;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const text = Buffer.concat(chunks).toString("utf8");
  if (text.length === 0) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new MockHttpError(400, "Request body must be valid JSON.");
  }
}

function parseJsonRpcText(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as Record<string, unknown>;
  }

  const dataLines = trimmed
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter((line) => line.length > 0);

  if (dataLines.length === 0) {
    throw new MockHttpError(502, "MCP proxy received an unparseable response.");
  }

  return JSON.parse(dataLines[dataLines.length - 1] ?? "{}") as Record<string, unknown>;
}

function getTargetBaseUrl(config: MockConfig, target: McpTarget): string {
  return target === "rest" ? config.mcpRestBaseUrl : config.mcpOpcUaBaseUrl;
}

function inferTargetFromToolName(name: string): McpTarget {
  return name.startsWith("opcua_") ? "opcua" : "rest";
}

async function forwardJsonRpc(
  config: MockConfig,
  target: McpTarget,
  payload: JsonRpcEnvelope,
): Promise<Record<string, unknown>> {
  const response = await fetch(getTargetBaseUrl(config, target), {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new MockHttpError(502, "MCP proxy request failed.", {
      target,
      status: response.status,
      body: text,
    });
  }

  return parseJsonRpcText(text);
}

function parseToolContent(result: Record<string, unknown> | undefined): unknown {
  const content = result?.content;
  if (!Array.isArray(content) || content.length === 0) {
    return result ?? null;
  }

  const firstItem = content[0];
  if (
    typeof firstItem === "object" &&
    firstItem !== null &&
    "text" in firstItem &&
    typeof firstItem.text === "string"
  ) {
    try {
      return JSON.parse(firstItem.text);
    } catch {
      return firstItem.text;
    }
  }

  return result;
}

export async function handleMcpToolsList(
  config: MockConfig,
  res: ServerResponse,
  target: McpTarget,
): Promise<void> {
  const payload = await forwardJsonRpc(config, target, {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/list",
    params: {},
  });

  const result = payload.result;
  const tools =
    typeof result === "object" && result !== null && Array.isArray((result as { tools?: unknown[] }).tools)
      ? (result as { tools: unknown[] }).tools.map((tool) =>
          typeof tool === "object" && tool !== null ? { ...tool, target } : tool,
        )
      : [];

  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ tools }));
}

export async function handleMcpToolCall(
  config: MockConfig,
  req: IncomingMessage,
  res: ServerResponse,
  target?: McpTarget,
): Promise<void> {
  const body = await readBody(req);
  const name = typeof body.name === "string" ? body.name : undefined;
  const args =
    typeof body.arguments === "object" && body.arguments !== null
      ? (body.arguments as Record<string, unknown>)
      : {};
  const requestTarget =
    body.target === "rest" || body.target === "opcua"
      ? (body.target as McpTarget)
      : target;

  if (!name) {
    throw new MockHttpError(400, "Tool call requests must include name.");
  }

  const resolvedTarget = requestTarget ?? inferTargetFromToolName(name);

  const payload = await forwardJsonRpc(config, resolvedTarget, {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name,
      arguments: args,
    },
  });

  const result =
    typeof payload.result === "object" && payload.result !== null
      ? (payload.result as Record<string, unknown>)
      : undefined;

  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      name,
      target: resolvedTarget,
      isError: Boolean(result?.isError),
      result: parseToolContent(result),
      raw: payload,
    }),
  );
}
