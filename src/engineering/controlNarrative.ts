import type { StrategyInput } from "./schemas.js";

export function generateControlNarrativeArtifact(input: StrategyInput): string {
  const objectives = input.objectives.map((objective) => `- ${objective}`).join("\n");
  const requirements = input.controlNarrativeRequirements
    .map((requirement) => `- ${requirement}`)
    .join("\n");
  const equipment = input.equipment.map((item) => `- ${item}`).join("\n");

  return `# Proposed Control Narrative

This is a proposed engineering artifact for human review. It must not be applied directly to a live DeltaV system.

## Scope

- Title: ${input.title}
- Area: ${input.area}

## Equipment

${equipment}

## Objectives

${objectives}

## Narrative Requirements

${requirements || "- No additional narrative requirements were provided."}

## Modes

${input.modes.map((mode) => `- ${mode}`).join("\n") || "- Review required."}

## Engineering Review Notes

- Confirm DeltaV module naming and class conventions against site standards.
- Confirm alarm settings, interlocks, and permissives during formal design review.
- Route the proposed strategy through management-of-change before implementation.
`;
}
