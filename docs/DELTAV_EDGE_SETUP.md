# DeltaV Edge Setup

## Required Configuration

Minimum required variables:

- `DELTAV_EDGE_BASE_URL`
- `DELTAV_EDGE_USERNAME`
- `DELTAV_EDGE_PASSWORD`
- `DELTAV_EDGE_VERIFY_TLS`
- `DELTAV_MCP_MODE`
- `DELTAV_AUDIT_LOG_PATH`
- `DELTAV_PACKAGE_OUTPUT_DIR`

Optional but commonly used:

- `DELTAV_USE_MOCK`
- `DELTAV_ALLOWED_AREAS`
- `DELTAV_ALLOWED_ENTITIES`
- endpoint override variables
- HTTP transport variables
- mock service variables

## Full Example

```env
DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/
DELTAV_EDGE_USERNAME=demo
DELTAV_EDGE_PASSWORD=demo
DELTAV_EDGE_VERIFY_TLS=false
DELTAV_MCP_MODE=READ_ONLY
DELTAV_ALLOWED_AREAS=
DELTAV_ALLOWED_ENTITIES=
DELTAV_AUDIT_LOG_PATH=./logs/audit.log
DELTAV_PACKAGE_OUTPUT_DIR=./generated-packages
DELTAV_USE_MOCK=true
DELTAV_EDGE_ENDPOINT_AUTH_TOKEN=/api/v1/Login/GetAuthToken/profile
DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION=/api/v1/graph
DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY=/api/v1/graph/{entityId}
DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION=/api/v1/history
DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID=/api/v1/history/{entityId}
DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS=/api/v1/ae
DELTAV_EDGE_ENDPOINT_BATCH_EVENTS=/api/v1/batchevent
DELTAV_HTTP_ENABLED=false
DELTAV_HTTP_HOST=0.0.0.0
DELTAV_HTTP_PORT=3000
DELTAV_HTTP_PATH=/mcp
DELTAV_HTTP_STATELESS=true
MOCK_DELTAV_EDGE_HOST=0.0.0.0
MOCK_DELTAV_EDGE_PORT=8080
MOCK_DELTAV_EDGE_BASE_PATH=/edge/api/v1
```

## Startup Validation Behavior

The server validates configuration at startup and fails closed when required values are missing or invalid.

Key behaviors:

- booleans must be literal `true` or `false`
- HTTP port must be a valid integer port
- audit log path must resolve inside the repo working directory
- package output path must resolve inside the repo working directory
- passwords are not printed in returned errors

## Endpoint Assumptions

The server does not claim universal knowledge of DeltaV Edge route paths. Endpoint values are centralized and configurable so site documentation remains the source of truth.

Default endpoint assumptions for non-mock use:

- auth token: `/connect/token`
- graph search: `/api/graph/search`
- graph entity: `/api/graph/entities/{entityId}`
- history collection: `/api/history`
- history by id: `/api/history/{entityId}`
- alarms/events: `/api/ae`
- batch events: `/api/batchevent`

Mock endpoint assumptions:

- auth token: `/api/v1/Login/GetAuthToken/profile`
- graph search: `/api/v1/graph`
- graph entity: `/api/v1/graph/{entityId}`
- history collection: `/api/v1/history`
- history by id: `/api/v1/history/{entityId}`
- alarms/events: `/api/v1/ae`
- batch events: `/api/v1/batchevent`

These paths must still be confirmed against the installed DeltaV Edge documentation before using a real site environment.

## TLS Verification

Use `DELTAV_EDGE_VERIFY_TLS=true` for real environments unless a deliberate, approved non-production exception exists.

For the local mock environment, `false` is expected.

## Authentication

The client authenticates against the configured token endpoint using form-encoded credentials and caches the bearer token in memory.

Operational notes:

- no token persistence to disk
- no token logging
- no authorization-header logging
- force-refresh is supported for auth-status checks

## Access Control

Optional allowlists:

- `DELTAV_ALLOWED_AREAS=Area100,Area200`
- `DELTAV_ALLOWED_ENTITIES=UNIT_120,REACTOR_01,TIC_101`

When either allowlist is populated, requests outside those values are denied.

## HTTP Transport

Enable HTTP MCP transport with:

```env
DELTAV_HTTP_ENABLED=true
DELTAV_HTTP_HOST=0.0.0.0
DELTAV_HTTP_PORT=3000
DELTAV_HTTP_PATH=/mcp
DELTAV_HTTP_STATELESS=true
```

Routes:

- MCP endpoint: `POST /mcp`
- health endpoint: `GET /healthz`

If `DELTAV_HTTP_STATELESS=false`, the transport can issue session IDs.

## Mock Setup

Typical mock workflow:

1. Run `npm run dev:mock`.
2. Point `DELTAV_EDGE_BASE_URL` at `http://localhost:8080/edge/`.
3. Set `DELTAV_USE_MOCK=true`.
4. Override the endpoint variables to the `/api/v1/*` mock routes.
5. Run `npm run dev` for the MCP server.

## Docker Compose

`docker compose up --build` starts:

- `deltav-edge-mcp-server`
- `mock-deltav-edge`

The compose file forces the MCP container into HTTP mode and points it at the mock service using the mock endpoint map.
