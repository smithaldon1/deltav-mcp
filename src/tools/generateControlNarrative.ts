import { strategyInputSchema } from "../engineering/schemas.js";
import { generateControlNarrativeArtifact } from "../engineering/controlNarrative.js";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const schema = strategyInputSchema;

export function registerGenerateControlNarrativeTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "generate_control_narrative",
    "Generate an offline proposed control narrative that requires human engineering review.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "generate_control_narrative",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertSandboxEngineeringMode(context.config);
          const openQuestions = deriveOpenEngineeringQuestions(input);
          return {
            artifactType: "control_narrative",
            content: generateControlNarrativeArtifact(input),
            openQuestions,
          };
        },
      ),
  );
}
