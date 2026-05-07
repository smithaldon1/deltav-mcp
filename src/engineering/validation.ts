import { inspectForProhibitedActions } from "../safety/guardrails.js";
import type { SiteStandards } from "./siteStandards.js";
import { defaultSiteStandards } from "./siteStandards.js";
import type { StrategyInput } from "./schemas.js";

export interface ValidationIssue {
  readonly severity: "error" | "warning";
  readonly message: string;
}

export interface ValidationReport {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

export function validateStrategy(
  input: StrategyInput,
  standards: SiteStandards = defaultSiteStandards,
): ValidationReport {
  const issues: ValidationIssue[] = [];

  if (!standards.namingPrefixPattern.test(input.namingPrefix)) {
    issues.push({
      severity: "error",
      message: "Naming prefix does not comply with the configured site standard.",
    });
  }

  for (const alarm of input.alarms) {
    if (!standards.allowedAlarmPriorities.includes(alarm.priority)) {
      issues.push({
        severity: "error",
        message: `Alarm ${alarm.name} uses an unsupported priority.`,
      });
    }
  }

  for (const interlock of input.interlocks) {
    if (!interlock.resetRequirement.trim()) {
      issues.push({
        severity: "error",
        message: `Interlock ${interlock.cause} is missing reset coverage.`,
      });
    }

    if (interlock.bypassAllowed) {
      issues.push({
        severity: "warning",
        message: `Interlock ${interlock.cause} includes bypass allowance and requires engineering review.`,
      });
    }
  }

  if (input.alarms.length > 0 && input.failureScenarios.length === 0) {
    issues.push({
      severity: "warning",
      message: "Failure scenarios should cover alarm testing.",
    });
  }

  const prohibited = inspectForProhibitedActions(input);
  if (prohibited) {
    issues.push({
      severity: "error",
      message: prohibited.reason,
    });
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
