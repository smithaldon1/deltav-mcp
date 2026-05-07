import { redactSecrets, sanitizeForError } from "./redaction.js";
export { redactSecrets, sanitizeForError } from "./redaction.js";

export class AppError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFIGURATION_ERROR", message, details);
    this.name = "ConfigurationError";
  }
}

export class AccessDeniedError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("ACCESS_DENIED", message, details);
    this.name = "AccessDeniedError";
  }
}

export class ProhibitedActionError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("PROHIBITED_ACTION", message, details);
    this.name = "ProhibitedActionError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class DeltaVClientError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("DELTAV_CLIENT_ERROR", message, details);
    this.name = "DeltaVClientError";
  }
}

export function toErrorSummary(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: sanitizeForError(error.details),
    };
  }

  if (error instanceof Error) {
    return {
      code: "UNEXPECTED_ERROR",
      message: redactSecrets(error.message),
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred.",
  };
}
