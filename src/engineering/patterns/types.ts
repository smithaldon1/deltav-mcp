export interface EngineeringPattern {
  readonly name: string;
  readonly summary: string;
  readonly purpose: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly parameters: readonly string[];
  readonly alarms: readonly string[];
  readonly interlocks: readonly string[];
  readonly operatingModes: readonly string[];
  readonly failureModes: readonly string[];
  readonly operatorActions: readonly string[];
  readonly testCases: readonly string[];
  readonly commonDesignMistakes: readonly string[];
  readonly deltaVImplementationNotes: readonly string[];
  readonly openEngineeringQuestions: readonly string[];
}
