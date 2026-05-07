import type { IncomingMessage } from "node:http";

export function logRequest(req: IncomingMessage): void {
  const now = new Date().toISOString();
  const method = req.method ?? "GET";
  const url = req.url ?? "/";
  console.log(`[mock-deltav-edge] ${now} ${method} ${url}`);
}
