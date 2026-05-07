import { strategyInputSchema } from "../engineering/schemas.js";
import { generateTestProtocolArtifact } from "../engineering/testProtocol.js";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const schema = strategyInputSchema;

export function registerGenerateTestProtocolTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "generate_test_protocol",
    "Generate an offline FAT/SAT-style test protocol covering modes, alarms, interlocks, failures, and reset behavior.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "generate_test_protocol",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertSandboxEngineeringMode(context.config);
          return {
            artifactType: "test_protocol",
            content: generateTestProtocolArtifact(input),
            openQuestions: deriveOpenEngineeringQuestions(input),
          };
        },
      ),
  );
}
