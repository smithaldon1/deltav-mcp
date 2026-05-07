import type { InterlockDefinition } from "./schemas.js";

export function generateInterlockMatrixArtifact(
  interlocks: readonly InterlockDefinition[],
): readonly InterlockDefinition[] {
  return interlocks;
}

export function renderInterlockMatrixCsv(interlocks: readonly InterlockDefinition[]): string {
  const header = "cause,condition,effect,reset_requirement,bypass_allowed,notes";
  const lines = interlocks.map((interlock) =>
    [
      interlock.cause,
      interlock.condition,
      interlock.effect,
      interlock.resetRequirement,
      interlock.bypassAllowed ? "ENGINEERING_REVIEW_REQUIRED" : "NO",
      interlock.notes,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [header, ...lines].join("\n");
}

function csvEscape(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}
