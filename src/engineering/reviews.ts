export interface ReviewFinding {
  readonly severity: "info" | "warning" | "error";
  readonly category: string;
  readonly finding: string;
  readonly recommendation: string;
  readonly location?: string;
}

export interface ReviewResult {
  readonly passed: boolean;
  readonly findings: readonly ReviewFinding[];
  readonly openQuestions: readonly string[];
}

export function finalizeReview(
  findings: readonly ReviewFinding[],
  openQuestions: readonly string[],
): ReviewResult {
  return {
    passed: findings.every((finding) => finding.severity !== "error"),
    findings,
    openQuestions,
  };
}
