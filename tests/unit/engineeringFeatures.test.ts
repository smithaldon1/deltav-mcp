import { describe, expect, it } from "vitest";
import { relationshipDiagram, sequenceDiagram, stateDiagram } from "../../src/engineering/diagrams.js";
import { deriveOpenEngineeringQuestions } from "../../src/engineering/openQuestions.js";
import { getEngineeringPattern, listEngineeringPatterns } from "../../src/engineering/patterns/index.js";
import { registerPrompts } from "../../src/prompts/registerPrompts.js";
import { registerResources } from "../../src/resources/registerResources.js";

describe("engineering features", () => {
  it("lists and retrieves engineering patterns", () => {
    expect(listEngineeringPatterns().length).toBeGreaterThanOrEqual(10);
    expect(getEngineeringPattern("pid_loop")?.purpose).toContain("Maintain");
  });

  it("registers prompts and resources", () => {
    const promptNames: string[] = [];
    const resourceUris: string[] = [];
    const fakeServer = {
      registerPrompt(name: string) {
        promptNames.push(name);
      },
      registerResource(_name: string, uri: string) {
        resourceUris.push(uri);
      },
    };

    registerPrompts(fakeServer as never);
    registerResources(fakeServer as never);

    expect(promptNames).toContain("investigate_abnormal_event");
    expect(resourceUris).toContain("deltav://standards/naming-conventions");
  });

  it("builds Mermaid diagram text and open questions", () => {
    expect(relationshipDiagram("Module", ["A", "B"])).toContain("flowchart TD");
    expect(sequenceDiagram("Seq", ["Step 1"])).toContain("sequenceDiagram");
    expect(stateDiagram("State", ["Idle", "Run"])).toContain("stateDiagram-v2");
    expect(deriveOpenEngineeringQuestions({ modes: [], failureScenarios: [] }).length).toBeGreaterThan(0);
  });
});
