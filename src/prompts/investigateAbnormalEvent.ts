import { buildEngineeringWorkflowPrompt } from "./helpers.js";

export const investigateAbnormalEventPrompt = buildEngineeringWorkflowPrompt(
  "investigate_abnormal_event",
  "Build a conservative abnormal-event assessment from alarms, history, and timeline evidence.",
  [
    "Collect alarms/events for the target window.",
    "Collect supporting history and trend pack for affected modules.",
    "Generate a chronological event timeline.",
    "Identify first-out candidates and supporting contradictions.",
    "List open questions and recommended engineering follow-up.",
  ],
);
