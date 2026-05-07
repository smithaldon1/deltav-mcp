export interface SeriesDefinition {
  readonly scenario: string;
  readonly baseValue: number;
  readonly amplitude: number;
  readonly noise: number;
}

export interface TimeSeriesPoint {
  readonly timestamp: string;
  readonly value: number | null;
  readonly quality: string;
}

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function scenarioValue(definition: SeriesDefinition, ratio: number, index: number): number | null {
  const noise = (seededNoise(index + definition.baseValue) - 0.5) * definition.noise * 2;

  switch (definition.scenario) {
    case "stable_operation":
      return definition.baseValue + Math.sin(ratio * Math.PI * 2) * definition.amplitude * 0.2 + noise;
    case "ramp":
      return definition.baseValue + definition.amplitude * ratio + noise;
    case "oscillation":
      return definition.baseValue + Math.sin(ratio * Math.PI * 6) * definition.amplitude + noise;
    case "step_change":
      return definition.baseValue + (ratio > 0.5 ? definition.amplitude : 0) + noise;
    case "sensor_dropout":
      return ratio > 0.7 && ratio < 0.8 ? null : definition.baseValue + Math.sin(ratio * Math.PI * 3) * definition.amplitude + noise;
    case "noisy_signal":
      return definition.baseValue + noise * definition.amplitude * 4;
    case "process_excursion":
      return ratio > 0.4 && ratio < 0.65
        ? definition.baseValue + definition.amplitude * (1 - Math.abs(0.525 - ratio) * 5) + noise
        : definition.baseValue + noise;
    case "recovery_after_trip":
      return ratio < 0.3
        ? definition.baseValue + definition.amplitude
        : definition.baseValue + Math.max(0, definition.amplitude * (1 - ratio)) + noise;
    default:
      return definition.baseValue + noise;
  }
}

export function generateTimeSeries(
  definition: SeriesDefinition,
  startTime: Date,
  endTime: Date,
  pointCount: number,
): readonly TimeSeriesPoint[] {
  const duration = endTime.getTime() - startTime.getTime();
  const count = Math.max(2, pointCount);

  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    const timestamp = new Date(startTime.getTime() + duration * ratio).toISOString();
    const value = scenarioValue(definition, ratio, index);

    return {
      timestamp,
      value: value === null ? null : Number(value.toFixed(3)),
      quality: value === null ? "BAD" : "GOOD",
    };
  });
}

export function aggregateSeries(
  values: readonly TimeSeriesPoint[],
  aggregation: string,
): number | null {
  const numeric = values
    .map((item) => item.value)
    .filter((value): value is number => typeof value === "number");

  if (numeric.length === 0) {
    return null;
  }

  switch (aggregation.toLowerCase()) {
    case "average":
      return Number((numeric.reduce((sum, value) => sum + value, 0) / numeric.length).toFixed(3));
    case "minimum":
      return Math.min(...numeric);
    case "maximum":
      return Math.max(...numeric);
    case "count":
      return numeric.length;
    case "start":
      return numeric[0] ?? null;
    case "end":
      return numeric.at(-1) ?? null;
    case "range":
      return Math.max(...numeric) - Math.min(...numeric);
    case "interpolative":
      return numeric[Math.floor(numeric.length / 2)] ?? null;
    default:
      return null;
  }
}
