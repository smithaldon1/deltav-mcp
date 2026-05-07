import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeEngineeringPackage } from "../../src/engineering/packageWriter.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "deltav-package-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("engineering package integration", () => {
  it("writes the expected engineering package artifact set", async () => {
    const baseDir = await makeTempDir();
    const files = {
      "control_narrative.md": "# Proposed Control Narrative",
      "module_design.json": "{}",
      "module_design.md": "# Module Design",
      "alarm_list.csv": "alarm_name",
      "alarm_list.json": "[]",
      "interlock_matrix.csv": "cause",
      "interlock_matrix.json": "[]",
      "test_protocol.md": "# Test Protocol",
      "moc_summary.md": "# MOC",
      "risk_review.md": "# Risk",
      "validation_report.json": "{\"valid\":true}",
    };

    const result = await writeEngineeringPackage(baseDir, "reactor-feed", files);
    const dirEntries = await fs.readdir(result.packagePath);

    expect(dirEntries.sort()).toEqual(Object.keys(files).sort());
  });
});
