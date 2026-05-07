export function parseCsvSelector(value: string | null): string[] | null {
  if (value === null || value === "1") {
    return null;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function filterFields<T extends Record<string, unknown>>(
  record: T,
  fields: string[] | null,
): Record<string, unknown> {
  if (fields === null) {
    return { ...record };
  }

  return Object.fromEntries(fields.filter((field) => field in record).map((field) => [field, record[field]]));
}
