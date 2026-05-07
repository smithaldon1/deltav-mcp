import type { IncomingMessage, ServerResponse } from "node:http";
import { issueToken } from "../middleware/auth.js";

export async function handleAuth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readBody(req);
  const username = typeof body.username === "string" ? body.username : "demo";

  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      access_token: issueToken(username),
      token_type: "Bearer",
      expires_in: 3600,
      profile: body.profile ?? "mock",
    }),
  );
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
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
}
