export interface SiteStandards {
  readonly namingPrefixPattern: RegExp;
  readonly allowedAlarmPriorities: readonly string[];
}

export const defaultSiteStandards: SiteStandards = {
  namingPrefixPattern: /^[A-Z][A-Z0-9_]{2,}$/,
  allowedAlarmPriorities: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
};
