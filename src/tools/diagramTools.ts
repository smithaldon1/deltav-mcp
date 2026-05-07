import { z } from "zod";
import { relationshipDiagram, sequenceDiagram, stateDiagram, wrapMermaid } from "../engineering/diagrams.js";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import type { ToolContext, ToolRegister } from "./registerTools.js";
import { assertSandboxEngineeringMode, withToolAudit } from "./toolUtils.js";

const nameAndNodesSchema = z.object({
  title: z.string().min(1),
  entities: z.array(z.string().min(1)).min(1),
});

const listSchema = z.object({
  title: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
});

export function registerDiagramTools(register: ToolRegister, context: ToolContext): void {
  register("generate_module_relationship_diagram", "Generate Mermaid text showing module relationships.", nameAndNodesSchema, async (input, meta) => withToolAudit({ toolName: "generate_module_relationship_diagram", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    assertSandboxEngineeringMode(context.config);
    return { mermaid: relationshipDiagram(input.title, input.entities), openQuestions: deriveOpenEngineeringQuestions({}) };
  }));
  register("generate_cause_effect_diagram", "Generate Mermaid text for cause-and-effect logic.", nameAndNodesSchema, async (input, meta) => withToolAudit({ toolName: "generate_cause_effect_diagram", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    assertSandboxEngineeringMode(context.config);
    return { mermaid: wrapMermaid(input.entities.map((entity, index) => `${index === 0 ? "CAUSE" : `N${index - 1}`}["${index === 0 ? input.title : input.entities[index - 1]}"] --> N${index}["${entity}"]`)), openQuestions: deriveOpenEngineeringQuestions({}) };
  }));
  register("generate_sequence_logic_diagram", "Generate Mermaid text for sequence logic.", listSchema, async (input, meta) => withToolAudit({ toolName: "generate_sequence_logic_diagram", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    assertSandboxEngineeringMode(context.config);
    return { mermaid: sequenceDiagram(input.title, input.steps), openQuestions: deriveOpenEngineeringQuestions({}) };
  }));
  register("generate_mode_state_diagram", "Generate Mermaid text for mode/state transitions.", listSchema, async (input, meta) => withToolAudit({ toolName: "generate_mode_state_diagram", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    assertSandboxEngineeringMode(context.config);
    return { mermaid: stateDiagram(input.title, input.steps), openQuestions: deriveOpenEngineeringQuestions({}) };
  }));
  register("generate_batch_phase_diagram", "Generate Mermaid text for a batch phase flow.", listSchema, async (input, meta) => withToolAudit({ toolName: "generate_batch_phase_diagram", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    assertSandboxEngineeringMode(context.config);
    return { mermaid: sequenceDiagram(input.title, input.steps), openQuestions: deriveOpenEngineeringQuestions({}) };
  }));
  register("generate_alarm_response_diagram", "Generate Mermaid text for alarm response flow.", listSchema, async (input, meta) => withToolAudit({ toolName: "generate_alarm_response_diagram", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    assertSandboxEngineeringMode(context.config);
    return { mermaid: sequenceDiagram(input.title, input.steps), openQuestions: deriveOpenEngineeringQuestions({}) };
  }));
}
