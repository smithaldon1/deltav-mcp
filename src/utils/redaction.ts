const SECRET_PATTERNS = [
  /password/gi,
  /token/gi,
  /authorization/gi,
  /secret/gi,
  /private[-_ ]?key/gi,
  /certificate/gi,
];

export function redactSecrets(value: string): string {
  let redacted = value;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

export function sanitizeForError(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return redactSecrets(input);
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeForError(item));
  }

  if (typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => {
        if (SECRET_PATTERNS.some((pattern) => pattern.test(key))) {
          return [key, "[REDACTED]"];
        }

        return [key, sanitizeForError(value)];
      }),
    );
  }

  return input;
}
