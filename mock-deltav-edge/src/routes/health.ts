import type { ServerResponse } from "node:http";

export function handleHealth(res: ServerResponse): void {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      service: "mock-deltav-edge",
      warning: "Development and testing only. Not a certified DeltaV Edge emulator.",
    }),
  );
}
