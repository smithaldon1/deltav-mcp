import { strategyInputSchema } from "../engineering/schemas.js";
import {
  generateControlModuleDesignArtifact,
  renderControlModuleDesignMarkdown,
} from "../engineering/controlModuleDesign.js";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const schema = strategyInputSchema;

export function registerGenerateControlModuleDesignTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "generate_control_module_design",
    "Generate an offline proposed DeltaV control module design. The output is not import-ready.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "generate_control_module_design",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertSandboxEngineeringMode(context.config);
          const artifact = generateControlModuleDesignArtifact(input);
          return {
            artifactType: "control_module_design",
            moduleDesign: artifact,
            markdown: renderControlModuleDesignMarkdown(artifact),
            openQuestions: deriveOpenEngineeringQuestions(input),
          };
        },
      ),
  );
}
