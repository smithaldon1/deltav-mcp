import { buildEngineeringWorkflowPrompt } from "./helpers.js";
export const generatePidLoopDesignPrompt = buildEngineeringWorkflowPrompt("generate_pid_loop_design", "Generate an offline PID loop design proposal.", ["Use the PID loop pattern.", "Document tuning assumptions, limits, mode transfers, and bad-quality behavior.", "Flag missing cascade or tracking requirements as open questions."]);
