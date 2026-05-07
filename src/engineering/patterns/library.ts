import type { EngineeringPattern } from "./types.js";

function pattern(
  name: string,
  summary: string,
  purpose: string,
  extras: Partial<EngineeringPattern> = {},
): EngineeringPattern {
  return {
    name,
    summary,
    purpose,
    inputs: extras.inputs ?? [],
    outputs: extras.outputs ?? [],
    parameters: extras.parameters ?? [],
    alarms: extras.alarms ?? [],
    interlocks: extras.interlocks ?? [],
    operatingModes: extras.operatingModes ?? [],
    failureModes: extras.failureModes ?? [],
    operatorActions: extras.operatorActions ?? [],
    testCases: extras.testCases ?? [],
    commonDesignMistakes: extras.commonDesignMistakes ?? [],
    deltaVImplementationNotes: extras.deltaVImplementationNotes ?? [],
    openEngineeringQuestions: extras.openEngineeringQuestions ?? [],
  };
}

export const engineeringPatterns: readonly EngineeringPattern[] = [
  pattern("pid_loop", "Single-loop PID control", "Maintain a process variable at setpoint.", {
    inputs: ["PV", "SP", "MODE", "TRACK", "CAS_IN"],
    outputs: ["OUT", "BKCAL_OUT"],
    parameters: ["GAIN", "RESET", "RATE", "HI_LIM", "LO_LIM"],
    alarms: ["PV_HI", "PV_LO", "BAD_QUALITY"],
    interlocks: ["Output clamp on trip"],
    operatingModes: ["AUTO", "MANUAL", "CASCADE"],
    failureModes: ["Sensor bad quality", "Output saturation", "Oscillation from poor tuning"],
    operatorActions: ["Acknowledge high deviation", "Return loop to AUTO after cause is cleared"],
    testCases: ["Bumpless manual/auto transfer", "High and low PV alarms", "Output limit behavior"],
    commonDesignMistakes: ["No bumpless transfer strategy", "Missing bad-quality handling"],
    deltaVImplementationNotes: ["Confirm BKCAL strategy and mode ownership in DeltaV class library."],
    openEngineeringQuestions: ["Is cascade required?", "What is the acceptable deviation band?"],
  }),
  pattern("cascade_loop", "Master/slave cascade loop", "Use a primary loop to drive a faster secondary loop."),
  pattern("ratio_control", "Ratio control", "Maintain one flow or feed stream at a defined ratio to another."),
  pattern("motor", "Motor control", "Start, stop, and protect a motor with permissives and trips."),
  pattern("valve", "Valve control", "Command and monitor a valve with fail-state expectations."),
  pattern("analog_input", "Analog input", "Scale, validate, alarm, and expose an analog input."),
  pattern("analog_output", "Analog output", "Drive a continuous output with limits and bad-quality handling."),
  pattern("discrete_input", "Discrete input", "Interpret a discrete device signal with fail-safe review."),
  pattern("discrete_output", "Discrete output", "Drive a discrete command signal with confirmation logic."),
  pattern("pump_skid", "Pump skid package", "Coordinate pump permissives, flow control, trips, and restart logic."),
  pattern("reactor_temperature_control", "Reactor temperature control", "Manage reactor heating/cooling and excursion response."),
  pattern("cip_sequence", "CIP sequence", "Sequence a clean-in-place cycle across rinse, wash, and drain phases."),
  pattern("batch_phase", "Batch phase", "Execute a batch phase with state, hold, retry, and abort handling."),
  pattern("equipment_module", "Equipment module", "Encapsulate equipment-level logic and faceplate behavior."),
  pattern("unit_module", "Unit module", "Coordinate unit-level state, ownership, and phase interaction."),
  pattern("permissive_interlock_logic", "Permissive/interlock logic", "Protect equipment and process with trip and reset logic."),
];

export function listEngineeringPatterns(): readonly Pick<EngineeringPattern, "name" | "summary">[] {
  return engineeringPatterns.map(({ name, summary }) => ({ name, summary }));
}

export function getEngineeringPattern(patternName: string): EngineeringPattern | undefined {
  return engineeringPatterns.find((pattern) => pattern.name === patternName);
}
