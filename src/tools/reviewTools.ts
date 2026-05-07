import { z } from "zod";
import { deriveOpenEngineeringQuestions } from "../engineering/openQuestions.js";
import { finalizeReview, type ReviewFinding } from "../engineering/reviews.js";
import { alarmDefinitionSchema, interlockDefinitionSchema, strategyInputSchema } from "../engineering/schemas.js";
import { defaultSiteStandards } from "../engineering/siteStandards.js";
import type { ToolContext, ToolRegister } from "./registerTools.js";
import { withToolAudit } from "./toolUtils.js";

const reviewTextSchema = z.object({
  content: z.string().min(1),
});

const alarmReviewSchema = z.object({
  alarms: z.array(alarmDefinitionSchema).min(1),
});

const interlockReviewSchema = z.object({
  interlocks: z.array(interlockDefinitionSchema).min(1),
});

function finding(
  severity: "info" | "warning" | "error",
  category: string,
  message: string,
  recommendation: string,
  location?: string,
): ReviewFinding {
  return {
    severity,
    category,
    finding: message,
    recommendation,
    ...(location ? { location } : {}),
  };
}

export function registerReviewTools(register: ToolRegister, context: ToolContext): void {
  register("review_control_narrative", "Review a control narrative for missing scope, assumptions, and safety detail.", reviewTextSchema, async (input, meta) => withToolAudit({ toolName: "review_control_narrative", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings: ReviewFinding[] = [];
    if (!/operator/i.test(input.content)) findings.push(finding("warning", "operator_actions", "Narrative does not clearly mention operator actions.", "Add operator guidance for alarms, trips, and resets."));
    if (!/interlock/i.test(input.content)) findings.push(finding("warning", "interlocks", "Narrative does not clearly mention interlocks or permissives.", "Document trips, permissives, and reset behavior."));
    return finalizeReview(findings, deriveOpenEngineeringQuestions({}));
  }));

  register("review_module_design", "Review a proposed module design object.", strategyInputSchema, async (input, meta) => withToolAudit({ toolName: "review_module_design", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings: ReviewFinding[] = [];
    if (!defaultSiteStandards.namingPrefixPattern.test(input.namingPrefix)) findings.push(finding("error", "naming", "Naming prefix does not match the site standard.", "Use an approved uppercase naming prefix.", "namingPrefix"));
    if (input.modes.length === 0) findings.push(finding("warning", "modes", "Operating modes are missing.", "Add explicit operating modes.", "modes"));
    return finalizeReview(findings, deriveOpenEngineeringQuestions(input));
  }));

  register("review_alarm_list", "Review alarm definitions for missing rationalization details.", alarmReviewSchema, async (input, meta) => withToolAudit({ toolName: "review_alarm_list", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings = input.alarms.flatMap((alarm) => {
      const alarmFindings: ReviewFinding[] = [];
      if (alarm.operatorAction.trim().length < 10) alarmFindings.push(finding("warning", "operator_actions", `Alarm ${alarm.name} has weak operator action guidance.`, "Provide a clearer operator response.", alarm.name));
      if (alarm.priority === "CRITICAL" && !/safety|trip|shutdown/i.test(alarm.consequence)) alarmFindings.push(finding("warning", "priority_basis", `Alarm ${alarm.name} is CRITICAL without explicit severe consequence wording.`, "Document the basis for critical priority.", alarm.name));
      return alarmFindings;
    });
    return finalizeReview(findings, deriveOpenEngineeringQuestions({ alarms: input.alarms }));
  }));

  register("review_interlock_matrix", "Review interlock definitions for cause/effect/reset completeness.", interlockReviewSchema, async (input, meta) => withToolAudit({ toolName: "review_interlock_matrix", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings = input.interlocks.flatMap((interlock) => {
      const interlockFindings: ReviewFinding[] = [];
      if (!interlock.resetRequirement.trim()) interlockFindings.push(finding("error", "reset", `Interlock ${interlock.cause} is missing reset behavior.`, "Document manual or automatic reset requirements.", interlock.cause));
      if (interlock.bypassAllowed) interlockFindings.push(finding("warning", "bypass", `Interlock ${interlock.cause} allows bypass.`, "Require explicit maintenance and MOC controls.", interlock.cause));
      return interlockFindings;
    });
    return finalizeReview(findings, deriveOpenEngineeringQuestions({ interlocks: input.interlocks }));
  }));

  register("review_test_protocol", "Review a FAT/SAT protocol for missing coverage.", reviewTextSchema, async (input, meta) => withToolAudit({ toolName: "review_test_protocol", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings: ReviewFinding[] = [];
    if (!/alarm/i.test(input.content)) findings.push(finding("warning", "alarm_tests", "Protocol does not explicitly mention alarm testing.", "Add alarm response and reset tests."));
    if (!/failure/i.test(input.content)) findings.push(finding("warning", "failure_modes", "Protocol does not explicitly mention failure scenario testing.", "Add simulated failure scenarios."));
    return finalizeReview(findings, deriveOpenEngineeringQuestions({}));
  }));

  register("identify_missing_failure_modes", "Identify likely missing failure modes in a strategy.", strategyInputSchema, async (input, meta) => withToolAudit({ toolName: "identify_missing_failure_modes", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings: ReviewFinding[] = [];
    if (!input.failureScenarios.some((scenario) => /quality|sensor|comm/i.test(scenario))) findings.push(finding("warning", "failure_modes", "No sensor-quality or communication failure scenario was identified.", "Consider bad-quality and comms-loss behavior."));
    if (!input.failureScenarios.some((scenario) => /trip|interlock/i.test(scenario))) findings.push(finding("warning", "failure_modes", "No trip or interlock failure scenario was identified.", "Add trip-response scenarios."));
    return finalizeReview(findings, deriveOpenEngineeringQuestions(input));
  }));

  register("identify_missing_operator_actions", "Identify missing operator actions in a strategy.", strategyInputSchema, async (input, meta) => withToolAudit({ toolName: "identify_missing_operator_actions", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings = input.alarms.filter((alarm) => alarm.operatorAction.trim().length < 10).map((alarm) => finding("warning", "operator_actions", `Alarm ${alarm.name} may not provide enough operator guidance.`, "Specify clear operator follow-up and escalation.", alarm.name));
    return finalizeReview(findings, deriveOpenEngineeringQuestions(input));
  }));

  register("identify_unsafe_assumptions", "Identify potentially unsafe assumptions in free-form engineering text.", reviewTextSchema, async (input, meta) => withToolAudit({ toolName: "identify_unsafe_assumptions", input, config: context.config, auditLogger: context.auditLogger, ...(meta?.sessionId ? { sessionId: meta.sessionId } : {}) }, async () => {
    const findings: ReviewFinding[] = [];
    if (/automatic restart/i.test(input.content)) findings.push(finding("warning", "restart", "Automatic restart is mentioned without explicit safeguards.", "Confirm restart policy and permissives."));
    if (/bypass allowed/i.test(input.content)) findings.push(finding("warning", "bypass", "Bypass allowance is mentioned.", "Document maintenance controls and approval gates."));
    if (!/review/i.test(input.content)) findings.push(finding("info", "review_gate", "Human review gate is not explicit.", "State that the proposal requires qualified engineering review."));
    return finalizeReview(findings, deriveOpenEngineeringQuestions({}));
  }));
}
