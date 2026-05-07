import { z } from "zod";
import { generateAlarmListArtifact, renderAlarmListCsv } from "../engineering/alarmList.js";
import {
  generateControlModuleDesignArtifact,
  renderControlModuleDesignMarkdown,
} from "../engineering/controlModuleDesign.js";
import { generateControlNarrativeArtifact } from "../engineering/controlNarrative.js";
import {
  generateInterlockMatrixArtifact,
  renderInterlockMatrixCsv,
} from "../engineering/interlockMatrix.js";
import { writeEngineeringPackage } from "../engineering/packageWriter.js";
import {
  deriveOpenEngineeringQuestions,
  renderOpenQuestionsMarkdown,
} from "../engineering/openQuestions.js";
import { strategyInputSchema } from "../engineering/schemas.js";
import { generateTestProtocolArtifact } from "../engineering/testProtocol.js";
import { validateStrategy } from "../engineering/validation.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const schema = z.object({
  packageName: z.string().min(1),
  overwrite: z.boolean().default(false),
  strategy: strategyInputSchema,
});

export function registerCreateEngineeringChangePackageTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "create_engineering_change_package",
    "Create a local offline engineering change package inside the configured output directory.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "create_engineering_change_package",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertSandboxEngineeringMode(context.config);
          const strategy = input.strategy;
          const moduleDesign = generateControlModuleDesignArtifact(strategy);
          const alarms = generateAlarmListArtifact(strategy.alarms);
          const interlocks = generateInterlockMatrixArtifact(strategy.interlocks);
          const validation = validateStrategy(strategy);
          const openQuestions = deriveOpenEngineeringQuestions(strategy);
          const assumptions = [
            "Proposed artifact only.",
            "Requires qualified engineering review.",
            "Requires site MOC/change-control process.",
            "Not approved for production until reviewed and approved.",
          ];
          const requirementsTraceabilityMatrix = [
            "requirement,linked_artifact,verification_method,status",
            `"Objectives","control_narrative.md","Review narrative coverage","PROPOSED"`,
            `"Alarms","alarm_list.json","Review operator action and consequence fields","PROPOSED"`,
            `"Interlocks","interlock_matrix.json","Review cause/effect/reset coverage","PROPOSED"`,
            `"Testing","test_protocol.md","Review FAT/SAT coverage","PROPOSED"`,
          ].join("\n");

          const result = await writeEngineeringPackage(
            context.config.packageOutputDir,
            input.packageName,
            {
              "control_narrative.md": generateControlNarrativeArtifact(strategy),
              "module_design.json": JSON.stringify(moduleDesign, null, 2),
              "module_design.md": renderControlModuleDesignMarkdown(moduleDesign),
              "alarm_list.csv": renderAlarmListCsv(alarms),
              "alarm_list.json": JSON.stringify(alarms, null, 2),
              "interlock_matrix.csv": renderInterlockMatrixCsv(interlocks),
              "interlock_matrix.json": JSON.stringify(interlocks, null, 2),
              "test_protocol.md": generateTestProtocolArtifact(strategy),
              "moc_summary.md": `# MOC Summary\n\nThis package is a proposed offline engineering artifact for human review.\n\n${assumptions.join("\n")}\n`,
              "requirements_traceability_matrix.csv": requirementsTraceabilityMatrix,
              "change_impact_assessment.md": `# Change Impact Assessment\n\n${assumptions.join("\n")}\n`,
              "risk_review.md": `# Risk Review\n\nEngineering review is required before any implementation or deployment activity.\n\n${assumptions.join("\n")}\n`,
              "rollback_plan.md": `# Rollback Plan\n\nDefine a reviewed rollback procedure before any implementation.\n`,
              "operator_training_notes.md": `# Operator Training Notes\n\nReview required alarm responses, mode transitions, and reset behavior before implementation.\n`,
              "commissioning_checklist.md": `# Commissioning Checklist\n\n- Confirm approved package revision\n- Confirm permissive/interlock testing\n- Confirm operator training completion\n`,
              "pre_startup_review_checklist.md": `# Pre-Startup Review Checklist\n\n- MOC approvals complete\n- Hazard review complete\n- Validation evidence complete\n`,
              "open_questions.md": `# Open Questions\n\n${renderOpenQuestionsMarkdown(openQuestions)}\n`,
              "assumptions.md": `# Assumptions\n\n${assumptions.map((item) => `- ${item}`).join("\n")}\n`,
              "validation_report.json": JSON.stringify(validation, null, 2),
            },
            input.overwrite,
          );

          return {
            packagePath: result.packagePath,
            files: result.filePaths,
            validation,
            openQuestions,
          };
        },
      ),
  );
}
