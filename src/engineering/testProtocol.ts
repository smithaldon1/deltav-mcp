import type { StrategyInput } from "./schemas.js";

export function generateTestProtocolArtifact(input: StrategyInput): string {
  const alarmTests = input.alarms.map(
    (alarm, index) =>
      `${index + 1}. Verify alarm ${alarm.name} annunciates at the defined condition and operator guidance is correct.`,
  );
  const interlockTests = input.interlocks.map(
    (interlock, index) =>
      `${index + 1}. Verify interlock cause "${interlock.cause}" produces effect "${interlock.effect}" and reset "${interlock.resetRequirement}".`,
  );
  const failureTests = input.failureScenarios.map(
    (scenario, index) => `${index + 1}. Simulate failure scenario: ${scenario}.`,
  );

  return `# FAT/SAT Test Protocol

This is a proposed engineering artifact for human review.

## Normal Operation

1. Verify the module initializes in a safe state.
2. Verify each operating mode transition is annunciated and documented.

## Mode Transitions

${input.modes.map((mode, index) => `${index + 1}. Verify transition into and out of ${mode}.`).join("\n") || "1. Review operating mode transitions."}

## Alarms

${alarmTests.join("\n") || "1. Review required alarm testing."}

## Interlocks

${interlockTests.join("\n") || "1. Review required interlock testing."}

## Failure Scenarios

${failureTests.join("\n") || "1. Review failure scenario coverage."}

## Reset Behavior

1. Verify reset logic is safe, documented, and approved during engineering review.
`;
}
