import fs from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const resourceMap: Record<string, string> = {
  "deltav://standards/naming-conventions": "site-standards/naming.md",
  "deltav://standards/alarm-philosophy": "site-standards/alarm-philosophy.md",
  "deltav://standards/module-templates/pid-loop": "site-standards/module-templates/pid-loop.md",
  "deltav://standards/module-templates/motor": "site-standards/module-templates/motor.md",
  "deltav://standards/module-templates/valve": "site-standards/module-templates/valve.md",
  "deltav://templates/control-narrative": "site-standards/templates/control-narrative-template.md",
  "deltav://templates/fat-sat": "site-standards/templates/fat-sat-template.md",
  "deltav://templates/moc": "site-standards/templates/moc-template.md",
  "deltav://templates/validation": "site-standards/templates/validation-template.md",
};

async function readApprovedResource(relativePath: string): Promise<string> {
  return fs.readFile(path.resolve(process.cwd(), relativePath), "utf8");
}

export function registerResources(server: McpServer): void {
  for (const [uri, relativePath] of Object.entries(resourceMap)) {
    server.registerResource(
      uri.replace("deltav://", "").replaceAll("/", "-"),
      uri,
      { mimeType: "text/markdown", description: "Approved DeltaV engineering reference." },
      async () => ({
        contents: [
          {
            uri,
            text: await readApprovedResource(relativePath),
          },
        ],
      }),
    );
  }
}
