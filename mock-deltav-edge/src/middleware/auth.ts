import type { IncomingMessage } from "node:http";
import { MockHttpError } from "../utils/errors.js";

export interface AuthResult {
  readonly token: string;
  readonly expired: boolean;
}

export function issueToken(username: string): string {
  return `mock-token:${username}`;
}

export function validateAuthHeader(req: IncomingMessage): AuthResult {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new MockHttpError(401, "Missing bearer token.");
  }

  const token = header.slice("Bearer ".length);
  if (token.includes("invalid")) {
    throw new MockHttpError(401, "Invalid token.");
  }

  if (token.includes("expired")) {
    throw new MockHttpError(401, "Expired token.");
  }

  return {
    token,
    expired: false,
  };
}
