import type { StrategyInput } from "./schemas.js";

export interface ControlModuleDesignArtifact {
  readonly moduleName: string;
  readonly area: string;
  readonly equipment: readonly string[];
  readonly modes: readonly string[];
  readonly objectives: readonly string[];
  readonly alarms: readonly {
    readonly name: string;
    readonly priority: string;
    readonly condition: string;
  }[];
  readonly interlocks: readonly {
    readonly cause: string;
    readonly effect: string;
    readonly resetRequirement: string;
  }[];
  readonly importReady: false;
  readonly disclaimer: string;
}

export function generateControlModuleDesignArtifact(
  input: StrategyInput,
): ControlModuleDesignArtifact {
  return {
    moduleName: `${input.namingPrefix}_${input.title.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
    area: input.area,
    equipment: input.equipment,
    modes: input.modes,
    objectives: input.objectives,
    alarms: input.alarms.map((alarm) => ({
      name: alarm.name,
      priority: alarm.priority,
      condition: alarm.condition,
    })),
    interlocks: input.interlocks.map((interlock) => ({
      cause: interlock.cause,
      effect: interlock.effect,
      resetRequirement: interlock.resetRequirement,
    })),
    importReady: false,
    disclaimer:
      "This is a proposed offline design artifact for human engineering review. It is not import-ready.",
  };
}

export function renderControlModuleDesignMarkdown(
  artifact: ControlModuleDesignArtifact,
): string {
  return `# Proposed Control Module Design

This is a proposed engineering artifact for human review. It is not import-ready.

- Module Name: ${artifact.moduleName}
- Area: ${artifact.area}
- Import Ready: No

## Equipment

${artifact.equipment.map((item) => `- ${item}`).join("\n")}

## Modes

${artifact.modes.map((mode) => `- ${mode}`).join("\n") || "- Review required."}

## Objectives

${artifact.objectives.map((objective) => `- ${objective}`).join("\n")}

## Alarms

${artifact.alarms.map((alarm) => `- ${alarm.name} [${alarm.priority}]: ${alarm.condition}`).join("\n") || "- None provided."}

## Interlocks

${artifact.interlocks.map((interlock) => `- Cause: ${interlock.cause}; Effect: ${interlock.effect}; Reset: ${interlock.resetRequirement}`).join("\n") || "- None provided."}
`;
}
