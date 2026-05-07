import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compareStrategyToSiteStandardPrompt } from "./compareStrategyToSiteStandard.js";
import { generateAlarmRationalizationPrompt } from "./generateAlarmRationalization.js";
import { generateBatchPhaseDesignPrompt } from "./generateBatchPhaseDesign.js";
import { generateFatSatProtocolPrompt } from "./generateFatSatProtocol.js";
import { generateMocPackagePrompt } from "./generateMocPackage.js";
import { generatePidLoopDesignPrompt } from "./generatePidLoopDesign.js";
import { generatePumpControlStrategyPrompt } from "./generatePumpControlStrategy.js";
import { investigateAbnormalEventPrompt } from "./investigateAbnormalEvent.js";
import { reviewControlModuleDesignPrompt } from "./reviewControlModuleDesign.js";
import { reviewInterlockMatrixPrompt } from "./reviewInterlockMatrix.js";

function registerTextPrompt(server: McpServer, name: string, description: string, text: string): void {
  server.registerPrompt(
    name,
    {
      description,
      argsSchema: {
        focus: z.string().optional().describe("Optional context or focus area."),
      },
    },
    async ({ focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${text}${focus ? `\nFocus: ${focus}` : ""}`,
          },
        },
      ],
    }),
  );
}

export function registerPrompts(server: McpServer): void {
  registerTextPrompt(server, "investigate_abnormal_event", "Guide a safe abnormal event investigation.", investigateAbnormalEventPrompt);
  registerTextPrompt(server, "review_control_module_design", "Guide module design review.", reviewControlModuleDesignPrompt);
  registerTextPrompt(server, "generate_pump_control_strategy", "Guide pump control strategy generation.", generatePumpControlStrategyPrompt);
  registerTextPrompt(server, "generate_pid_loop_design", "Guide PID loop design generation.", generatePidLoopDesignPrompt);
  registerTextPrompt(server, "generate_alarm_rationalization", "Guide alarm rationalization.", generateAlarmRationalizationPrompt);
  registerTextPrompt(server, "generate_batch_phase_design", "Guide batch phase design.", generateBatchPhaseDesignPrompt);
  registerTextPrompt(server, "generate_fat_sat_protocol", "Guide FAT/SAT protocol generation.", generateFatSatProtocolPrompt);
  registerTextPrompt(server, "generate_moc_package", "Guide MOC package generation.", generateMocPackagePrompt);
  registerTextPrompt(server, "review_interlock_matrix", "Guide interlock matrix review.", reviewInterlockMatrixPrompt);
  registerTextPrompt(server, "compare_strategy_to_site_standard", "Guide site-standard comparison.", compareStrategyToSiteStandardPrompt);
}
