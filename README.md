# deltav-edge-mcp-server

Safety-conscious TypeScript MCP server for Emerson DeltaV Edge read-only data access, investigation workflows, and offline engineering artifact generation.

## Safety Warning

This repository does **not** support live control actions. It must not be used to:

- write to live DeltaV controllers
- change live setpoints
- force I/O
- acknowledge or disable alarms
- bypass interlocks
- download logic to production
- modify SIS logic
- push generated logic into production

Only these operating modes are supported:

- `READ_ONLY` (default)
- `SANDBOX_ENGINEERING`

`SANDBOX_ENGINEERING` is limited to offline artifact generation, mock/simulator workflows, and local package output. It is not a production write mode.

## Architecture

```text
AI Client -> MCP Server -> DeltaV Edge REST API -> DeltaV Edge Environment -> DeltaV system replica/context
                                  |
                                  +-> Local engineering artifacts, site standards, prompts, and approved templates
```

The server communicates through the DeltaV Edge REST boundary and never directly to live controllers.

## What This Includes

- DeltaV Edge authentication status
- graph search and node context lookup
- history queries and alarm/event queries
- batch-event analysis when configured endpoints are available
- engineering investigation tools
- engineering review tools
- pattern library lookup
- Mermaid diagram generation
- offline engineering package generation with traceability artifacts
- a development-only mock DeltaV Edge REST API
- a browser-based mock UI for hierarchy browsing, trends, alarms, batch data, scenarios, and Mermaid previews

## Local Development

Install dependencies:

```bash
npm install
```

Run the MCP server over stdio:

```bash
npm run dev
```

Run the mock DeltaV Edge API:

```bash
npm run dev:mock
```

Open the mock UI:

```text
http://localhost:8080/
```

Build everything:

```bash
npm run build
```

Run tests and lint:

```bash
npm test
npm run lint
```

## Example `.env` for Mock Mode

```env
DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/
DELTAV_EDGE_USERNAME=demo
DELTAV_EDGE_PASSWORD=demo
DELTAV_EDGE_VERIFY_TLS=false
DELTAV_MCP_MODE=READ_ONLY
DELTAV_USE_MOCK=true
DELTAV_EDGE_ENDPOINT_AUTH_TOKEN=/api/v1/Login/GetAuthToken/profile
DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION=/api/v1/graph
DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY=/api/v1/graph/{entityId}
DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION=/api/v1/history
DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID=/api/v1/history/{entityId}
DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS=/api/v1/ae
DELTAV_EDGE_ENDPOINT_BATCH_EVENTS=/api/v1/batchevent
DELTAV_AUDIT_LOG_PATH=./logs/audit.log
DELTAV_PACKAGE_OUTPUT_DIR=./generated-packages
DELTAV_HTTP_ENABLED=false
```

## Running Both Services with Docker Compose

```bash
docker compose up --build
```

Services:

- MCP server: `http://localhost:3000/mcp` when HTTP mode is enabled
- Mock API health: `http://localhost:8080/health`
- Mock API web UI: `http://localhost:8080/`

Container controls:

- non-root runtime users where practical
- no privileged mode
- no Docker socket mount
- no host networking by default
- explicit volume mounts for `logs` and `generated-packages`
- `no-new-privileges`
- dropped Linux capabilities

## Environment Variables

Core variables:

```env
DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/
DELTAV_EDGE_USERNAME=demo
DELTAV_EDGE_PASSWORD=demo
DELTAV_EDGE_VERIFY_TLS=false
DELTAV_USE_MOCK=false
DELTAV_MCP_MODE=READ_ONLY
DELTAV_ALLOWED_AREAS=
DELTAV_ALLOWED_ENTITIES=
DELTAV_AUDIT_LOG_PATH=./logs/audit.log
DELTAV_PACKAGE_OUTPUT_DIR=./generated-packages
```

Configurable endpoint paths:

```env
DELTAV_EDGE_ENDPOINT_AUTH_TOKEN=/connect/token
DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION=/api/graph/search
DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY=/api/graph/entities/{entityId}
DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION=/api/history
DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID=/api/history/{entityId}
DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS=/api/ae
DELTAV_EDGE_ENDPOINT_BATCH_EVENTS=/api/batchevent
```

HTTP transport:

```env
DELTAV_HTTP_ENABLED=false
DELTAV_HTTP_HOST=0.0.0.0
DELTAV_HTTP_PORT=3000
DELTAV_HTTP_PATH=/mcp
DELTAV_HTTP_STATELESS=true
```

## Example MCP Client Config

```json
{
  "mcpServers": {
    "deltav-edge": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/deltav-mcp",
      "env": {
        "DELTAV_EDGE_BASE_URL": "http://localhost:8080/edge/",
        "DELTAV_EDGE_USERNAME": "demo",
        "DELTAV_EDGE_PASSWORD": "demo",
        "DELTAV_EDGE_VERIFY_TLS": "false",
        "DELTAV_USE_MOCK": "true",
        "DELTAV_MCP_MODE": "READ_ONLY"
      }
    }
  }
}
```

## Mock UI

The mock API includes a lightweight engineering-facing web UI at `http://localhost:8080/`.

It supports:

- home/status view with mock endpoint and auth status details
- API Explorer with sample requests and copyable `curl`
- React Flow hierarchy and relationship views
- ECharts trend, trend-pack, alarm analytics, and batch comparison views
- alarms/events and batch-event tables
- failure-scenario browser
- Mermaid preview for generated engineering diagrams
- MCP connection helper snippets for `.env`, Docker Compose, and MCP client config

Use it for:

- confirming the MCP server is pointed at the intended mock endpoint
- demoing graph, history, alarm, and batch behavior without a live DeltaV Edge system
- reproducing error simulation headers before running MCP integration tests

Limitations:

- development/testing only
- no live control or production write semantics
- mock payloads and routes are not a guarantee of real-site DeltaV Edge parity
- visualizations are read-only engineering and demo aids

## Documentation

- [docs/MOCK_DELTAV_EDGE.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/MOCK_DELTAV_EDGE.md)
- [docs/ENGINEERING_WORKFLOWS.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/ENGINEERING_WORKFLOWS.md)
- [docs/PATTERN_LIBRARY.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/PATTERN_LIBRARY.md)
- [docs/DIAGRAMS.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/DIAGRAMS.md)

## Known Limitations

- Real DeltaV Edge endpoint paths and payloads must be verified against installed site documentation before production-adjacent use.
- The mock API is for development, testing, demos, and CI only. It is not a certified DeltaV Edge emulator.
- The mock UI is also development-only and is intended for browsing, demos, and client-validation workflows.
- Investigation tools provide cautious engineering summaries, not proof of causation.
- Generated artifacts and diagrams are proposals only and require qualified engineering review and site MOC/change-control approval.
