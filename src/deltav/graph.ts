import type { GraphSearchRequest } from "./types.js";

export function buildGraphSearchQuery(input: GraphSearchRequest): URLSearchParams {
  const params = new URLSearchParams();

  if (input.query) {
    params.set("query", input.query);
  }

  if (input.area) {
    params.set("area", input.area);
  }

  params.set("limit", String(input.limit));
  return params;
}
