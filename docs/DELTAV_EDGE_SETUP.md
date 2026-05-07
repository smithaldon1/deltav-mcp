# DeltaV Edge Setup

## Required Configuration

Core settings:

- `DELTAV_EDGE_BASE_URL`
- `DELTAV_EDGE_USERNAME`
- `DELTAV_EDGE_PASSWORD`
- `DELTAV_EDGE_VERIFY_TLS`
- `DELTAV_MCP_MODE`
- `DELTAV_AUDIT_LOG_PATH`
- `DELTAV_PACKAGE_OUTPUT_DIR`

Optional:

- `DELTAV_USE_MOCK`
- `DELTAV_ALLOWED_AREAS`
- `DELTAV_ALLOWED_ENTITIES`
- configurable endpoint-path variables
- HTTP transport settings

## Endpoint Assumptions

The server does not claim universal knowledge of DeltaV Edge routes. Endpoint paths are configurable so site-specific documentation can be followed.

Defaults for real DeltaV assumptions:

- `/connect/token`
- `/api/graph/search`
- `/api/graph/entities/{entityId}`
- `/api/history`
- `/api/history/{entityId}`
- `/api/ae`
- `/api/batchevent`

Defaults for mock mode:

- `/api/v1/Login/GetAuthToken/profile`
- `/api/v1/graph`
- `/api/v1/graph/{entityId}`
- `/api/v1/history`
- `/api/v1/history/{entityId}`
- `/api/v1/ae`
- `/api/v1/batchevent`

These must be verified against the installed site documentation before using a real DeltaV Edge environment.

## TLS Verification

Keep `DELTAV_EDGE_VERIFY_TLS=true` for real environments unless a non-production exception is deliberately approved. Mock mode typically uses `false`.

## Authentication

The client authenticates through the configured auth route and caches a bearer token in memory. Secrets are validated at startup and must not be written to logs.
