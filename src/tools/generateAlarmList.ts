import { z } from "zod";
import { alarmDefinitionSchema } from "../engineering/schemas.js";
import {
  generateAlarmListArtifact,
  renderAlarmListCsv,
} from "../engineering/alarmList.js";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import type { ToolContext } from "./registerTools.js";
import type { ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const schema = z.object({
  alarms: z.array(alarmDefinitionSchema).min(1),
});

export function registerGenerateAlarmListTool(
  register: ToolRegister,
  context: ToolContext,
): void {
  register(
    "generate_alarm_list",
    "Generate offline alarm list artifacts in JSON and CSV-compatible structure.",
    schema,
    async (input, meta) =>
      withToolAudit(
        {
          toolName: "generate_alarm_list",
          input,
          config: context.config,
          auditLogger: context.auditLogger,
          ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}),
        },
        async () => {
          assertSandboxEngineeringMode(context.config);
          const alarms = generateAlarmListArtifact(input.alarms);
          return {
            artifactType: "alarm_list",
            alarms,
            csv: renderAlarmListCsv(alarms),
            openQuestions: deriveOpenEngineeringQuestions({ alarms }),
          };
        },
      ),
  );
}
