import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveSafePackageDir,
  sanitizePackageName,
  writeEngineeringPackage,
} from "../../src/engineering/packageWriter.js";
import { ValidationError } from "../../src/utils/errors.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "deltav-mcp-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("packageWriter", () => {
  it("sanitizes package names and rejects suspicious values", () => {
    expect(sanitizePackageName(" Reactor Feed Package ")).toBe("Reactor-Feed-Package");
    expect(() => sanitizePackageName("../escape")).toThrow(ValidationError);
  });

  it("prevents traversal outside the output directory", async () => {
    const baseDir = await makeTempDir();

    expect(() => resolveSafePackageDir(baseDir, "../escape")).toThrow(ValidationError);
  });

  it("writes an engineering package without overwriting by default", async () => {
    const baseDir = await makeTempDir();
    const result = await writeEngineeringPackage(baseDir, "package-a", {
      "control_narrative.md": "# Narrative",
      "validation_report.json": "{}",
    });

    expect(result.filePaths).toHaveLength(2);
    await expect(
      writeEngineeringPackage(baseDir, "package-a", {
        "control_narrative.md": "# Narrative",
      }),
    ).rejects.toThrow(ValidationError);
  });
});
