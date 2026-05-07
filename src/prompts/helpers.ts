export function buildEngineeringWorkflowPrompt(
  workflowName: string,
  objective: string,
  steps: readonly string[],
): string {
  return [
    `Workflow: ${workflowName}`,
    `Objective: ${objective}`,
    "Safety gates:",
    "- Use read-only DeltaV tools for evidence collection unless generating offline artifacts.",
    "- Do not propose live writes, downloads, alarm acknowledgement, setpoint changes, or bypass actions.",
    "- If evidence is missing, capture explicit open engineering questions instead of assuming.",
    "Suggested steps:",
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    "Human review gate:",
    "- Treat the outcome as a proposed engineering assessment requiring qualified review and MOC where applicable.",
  ].join("\n");
}
