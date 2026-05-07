export interface OpenQuestionSource {
  readonly modes?: readonly unknown[];
  readonly failureScenarios?: readonly unknown[];
  readonly interlocks?: readonly unknown[];
  readonly objectives?: readonly unknown[];
  readonly alarms?: readonly unknown[];
}

export function deriveOpenEngineeringQuestions(input: OpenQuestionSource): readonly string[] {
  const questions: string[] = [];

  if (!input.modes || input.modes.length === 0) {
    questions.push("What operating modes are required, and which permissives apply in each mode?");
  }

  if (!input.failureScenarios || input.failureScenarios.length === 0) {
    questions.push("Which failure scenarios must be explicitly tested and documented?");
  }

  if (!input.interlocks || input.interlocks.length === 0) {
    questions.push("Are there required trips, permissives, or interlocks that are not yet identified?");
  }

  questions.push("Should this equipment restart automatically after a reset, or require operator confirmation?");
  questions.push("Is bypass allowed during maintenance, and if so under what MOC-approved controls?");
  questions.push("Is the alarm operational, quality-critical, or safety-critical?");

  return Array.from(new Set(questions));
}

export function renderOpenQuestionsMarkdown(questions: readonly string[]): string {
  if (questions.length === 0) {
    return "No open engineering questions were identified.";
  }

  return questions.map((question, index) => `${index + 1}. ${question}`).join("\n");
}
