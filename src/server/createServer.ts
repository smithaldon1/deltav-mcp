import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "../tools/registerTools.js";
import { registerPrompts } from "../prompts/registerPrompts.js";
import { registerResources } from "../resources/registerResources.js";
import { registerTools } from "../tools/registerTools.js";

export function createServer(context: ToolContext): McpServer {
  const server = new McpServer(
    {
      name: "deltav-edge-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  registerTools(server, context);
  registerPrompts(server);
  registerResources(server);
  return server;
}
