import { detectProhibitedRequest, type ProhibitedActionRefusal } from "./prohibitedActions.js";

export function inspectForProhibitedActions(input: unknown): ProhibitedActionRefusal | null {
  const text = stringifyText(input);
  return text.length === 0 ? null : detectProhibitedRequest(text);
}

function stringifyText(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => stringifyText(item)).join(" ");
  }

  if (input && typeof input === "object") {
    return Object.values(input)
      .map((value) => stringifyText(value))
      .join(" ");
  }

  return "";
}
