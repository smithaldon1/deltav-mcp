import type { ServerResponse } from "node:http";
import graphData from "../data/graph.json" with { type: "json" };
import { filterFields, parseCsvSelector } from "../utils/filters.js";
import { MockHttpError } from "../utils/errors.js";

type GraphEntity = (typeof graphData.entities)[number];

function selectRelationships(entity: GraphEntity, relationshipFields: string[] | null) {
  const relationships: Record<string, unknown> = {};
  if (relationshipFields === null || relationshipFields.includes("Parents")) {
    relationships.Parents = entity.parents ?? [];
  }
  if (relationshipFields === null || relationshipFields.includes("Children")) {
    relationships.Children = entity.children ?? [];
  }
  return relationships;
}

function presentEntity(entity: GraphEntity, url: URL): Record<string, unknown> {
  const propertyFields = parseCsvSelector(url.searchParams.get("p"));
  const relationshipFields = parseCsvSelector(url.searchParams.get("r"));

  const base = {
    id: entity.id,
    name: entity.name,
    type: entity.type,
    area: entity.area ?? null,
    path: entity.path,
  };

  const runtime = filterFields(entity.runtime ?? {}, propertyFields);
  const relationships =
    url.searchParams.has("r") || relationshipFields === null
      ? selectRelationships(entity, relationshipFields)
      : {};

  return {
    ...base,
    ...(Object.keys(runtime).length > 0 ? { runtime } : {}),
    ...(Object.keys(relationships).length > 0 ? { relationships } : {}),
  };
}

export function handleGraphCollection(url: URL, res: ServerResponse): void {
  const queryPath = url.searchParams.get("path");
  const queryText = url.searchParams.get("query")?.toLowerCase();
  const area = url.searchParams.get("area");

  let entities = graphData.entities;

  if (queryPath) {
    entities = entities.filter((entity) => entity.path === queryPath);
  }

  if (queryText) {
    entities = entities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(queryText) ||
        entity.id.toLowerCase().includes(queryText) ||
        entity.path.toLowerCase().includes(queryText),
    );
  }

  if (area) {
    entities = entities.filter((entity) => entity.area === area);
  }

  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      results: entities.map((entity) => presentEntity(entity, url)),
    }),
  );
}

export function handleGraphEntity(url: URL, entityId: string, res: ServerResponse): void {
  const entity = graphData.entities.find(
    (item) => item.id === entityId || item.path === entityId,
  );
  if (!entity) {
    throw new MockHttpError(404, "Entity not found.", { entityId });
  }

  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(presentEntity(entity, url)));
}
