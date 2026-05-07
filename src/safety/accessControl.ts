import { AccessDeniedError } from "../utils/errors.js";

export interface AccessCheckInput {
  readonly entityId: string | undefined;
  readonly area: string | undefined;
  readonly entityPath: string | undefined;
}

export interface AccessControlConfig {
  readonly allowedAreas: readonly string[];
  readonly allowedEntities: readonly string[];
}

export function assertAccessAllowed(
  config: AccessControlConfig,
  input: AccessCheckInput,
): void {
  if (config.allowedAreas.length > 0) {
    if (!input.area || !config.allowedAreas.includes(input.area)) {
      throw new AccessDeniedError("Requested area is outside the configured allowlist.", {
        requestedArea: input.area ?? null,
      });
    }
  }

  if (config.allowedEntities.length > 0) {
    const matchesEntityId =
      input.entityId !== undefined && config.allowedEntities.includes(input.entityId);
    const matchesPath =
      input.entityPath !== undefined && config.allowedEntities.includes(input.entityPath);

    if (!matchesEntityId && !matchesPath) {
      throw new AccessDeniedError("Requested entity is outside the configured allowlist.", {
        requestedEntityId: input.entityId ?? null,
        requestedEntityPath: input.entityPath ?? null,
      });
    }
  }
}
