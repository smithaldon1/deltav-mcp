import type { AppConfig } from "../config/env.js";

export function buildAuthRequestBody(config: AppConfig): URLSearchParams {
  return new URLSearchParams({
    grant_type: "password",
    username: config.username,
    password: config.password,
  });
}
