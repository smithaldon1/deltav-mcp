import fs from "node:fs/promises";
import path from "node:path";
import type { DeltaVMcpMode } from "../config/env.js";
import { sanitizeForError } from "../utils/errors.js";
import { nowIsoString } from "../utils/time.js";

export interface AuditEntry {
  readonly timestamp: string;
  readonly toolName: string;
  readonly sanitizedInput: unknown;
  readonly status: "success" | "error" | "refused";
  readonly errorSummary: unknown;
  readonly mode: DeltaVMcpMode;
  readonly callerSession: string | undefined;
}

export class AuditLogger {
  constructor(private readonly logPath: string) {}

  async log(entry: Omit<AuditEntry, "timestamp">): Promise<void> {
    const record: AuditEntry = {
      ...entry,
      timestamp: nowIsoString(),
      sanitizedInput: sanitizeForError(entry.sanitizedInput),
      errorSummary: sanitizeForError(entry.errorSummary),
    };

    await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    await fs.appendFile(this.logPath, `${JSON.stringify(record)}\n`, "utf8");
  }
}
