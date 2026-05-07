import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeEngineeringPackage } from "../../src/engineering/packageWriter.js";

const tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "deltav-traceability-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("traceability artifacts", () => {
  it("supports the extended engineering package artifact set", async () => {
    const dir = await makeTempDir();
    const files = {
      "control_narrative.md": "",
      "module_design.md": "",
      "module_design.json": "",
      "alarm_list.csv": "",
      "alarm_list.json": "",
      "interlock_matrix.csv": "",
      "interlock_matrix.json": "",
      "test_protocol.md": "",
      "requirements_traceability_matrix.csv": "",
      "change_impact_assessment.md": "",
      "risk_review.md": "",
      "rollback_plan.md": "",
      "operator_training_notes.md": "",
      "commissioning_checklist.md": "",
      "pre_startup_review_checklist.md": "",
      "open_questions.md": "",
      "assumptions.md": "",
      "validation_report.json": ""
    };

    const result = await writeEngineeringPackage(dir, "pkg", files);
    const output = await fs.readdir(result.packagePath);
    expect(output).toContain("requirements_traceability_matrix.csv");
    expect(output).toContain("rollback_plan.md");
    expect(output).toContain("open_questions.md");
  });
});
