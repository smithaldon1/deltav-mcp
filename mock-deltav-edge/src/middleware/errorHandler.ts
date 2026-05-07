import type { ServerResponse } from "node:http";
import { MockHttpError } from "../utils/errors.js";

export function sendError(res: ServerResponse, error: unknown): void {
  if (error instanceof MockHttpError) {
    res.writeHead(error.statusCode, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: error.message,
        ...(error.payload && typeof error.payload === "object" ? error.payload : {}),
      }),
    );
    return;
  }

  res.writeHead(500, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Internal mock server error." }));
}
