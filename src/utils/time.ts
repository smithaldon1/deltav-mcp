import { ValidationError } from "./errors.js";

export function parseIsoDateTime(value: string, fieldName: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || !value.includes("T")) {
    throw new ValidationError(`Invalid ISO datetime for ${fieldName}.`, {
      fieldName,
      value,
    });
  }

  return date;
}

export function assertTimeRange(
  start: Date,
  end: Date,
  maxRangeHours: number,
): void {
  if (end <= start) {
    throw new ValidationError("End time must be later than start time.", {
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }

  const rangeHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  if (rangeHours > maxRangeHours) {
    throw new ValidationError(
      `Requested time range exceeds the maximum of ${maxRangeHours} hours.`,
      {
        start: start.toISOString(),
        end: end.toISOString(),
        maxRangeHours,
      },
    );
  }
}

export function nowIsoString(): string {
  return new Date().toISOString();
}
