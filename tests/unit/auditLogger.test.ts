import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AuditLogger } from "../../src/audit/auditLogger.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "deltav-audit-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("AuditLogger", () => {
  it("redacts secrets from persisted audit entries", async () => {
    const dir = await makeTempDir();
    const logPath = path.join(dir, "audit.log");
    const logger = new AuditLogger(logPath);

    await logger.log({
      toolName: "deltav_auth_status",
      sanitizedInput: {
        username: "engineer",
        password: "plain-text-password",
      },
      status: "success",
      mode: "READ_ONLY",
      callerSession: undefined,
      errorSummary: {
        authorization: "Bearer abc",
      },
    });

    const contents = await fs.readFile(logPath, "utf8");
    expect(contents).toContain("[REDACTED]");
    expect(contents).not.toContain("plain-text-password");
    expect(contents).not.toContain("Bearer abc");
  });
});
