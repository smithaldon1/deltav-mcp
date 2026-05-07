export function wrapMermaid(lines: readonly string[]): string {
  return ["flowchart TD", ...lines].join("\n");
}

export function relationshipDiagram(title: string, entities: readonly string[]): string {
  return wrapMermaid([
    `ROOT["${title}"]`,
    ...entities.map((entity, index) => `ROOT --> N${index}["${entity}"]`),
  ]);
}

export function sequenceDiagram(title: string, steps: readonly string[]): string {
  return ["sequenceDiagram", `participant Operator as ${title}`, ...steps.map((step, index) => `Operator->>Operator: ${index + 1}. ${step}`)].join("\n");
}

export function stateDiagram(title: string, states: readonly string[]): string {
  return ["stateDiagram-v2", `[*] --> ${states[0] ?? "Idle"}`, ...states.slice(1).map((state, index) => `${states[index] ?? "Idle"} --> ${state}`), `${states.at(-1) ?? "Idle"} --> [*]`, `note right of ${states[0] ?? "Idle"}: ${title}`].join("\n");
}
