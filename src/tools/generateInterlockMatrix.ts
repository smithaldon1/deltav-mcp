import { z } from "zod";
import { interlockDefinitionSchema } from "../engineering/schemas.js";
import {
  generateInterlockMatrixArtifact,
  renderInterlockMatrixCsv,
} from "../engineering/interlockMatrix.js";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const schema = z.object({
  interlocks: z.array(interlockDefinitionSchema).min(1),
});

export function registerGenerateInterlockMatrixTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "generate_interlock_matrix",
    "Generate a conservative offline cause-and-effect interlock matrix for engineering review.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "generate_interlock_matrix",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertSandboxEngineeringMode(context.config);
          const interlocks = generateInterlockMatrixArtifact(input.interlocks);
          return {
            artifactType: "interlock_matrix",
            interlocks,
            csv: renderInterlockMatrixCsv(interlocks),
            openQuestions: deriveOpenEngineeringQuestions({ interlocks }),
          };
        },
      ),
  );
}
