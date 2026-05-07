export interface ProhibitedActionRefusal {
  readonly allowed: false;
  readonly reason: string;
  readonly safeAlternative: string;
  readonly matchedPhrases: readonly string[];
}

const prohibitedPatterns = [
  /change( this| the)? setpoint/i,
  /acknowledge( this| the)? alarm/i,
  /bypass( this| the)? interlock/i,
  /force( this| the)? input/i,
  /download( this| the)? module/i,
  /push( this)? to production/i,
  /modify live control logic/i,
  /disable( this| the)? alarm/i,
  /write to deltav/i,
  /modify live controller configuration/i,
  /change live/i,
];

export function detectProhibitedRequest(input: string): ProhibitedActionRefusal | null {
  const matchedPhrases = prohibitedPatterns
    .filter((pattern) => pattern.test(input))
    .map((pattern) => pattern.source);

  if (matchedPhrases.length === 0) {
    return null;
  }

  return {
    allowed: false,
    reason: "Live control actions are not supported by this MCP server.",
    safeAlternative: "Generate an offline engineering change package for human review.",
    matchedPhrases,
  };
}
