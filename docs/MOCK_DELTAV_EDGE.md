# Mock DeltaV Edge

## Purpose

`mock-deltav-edge` is a local simulated REST API and browser UI for development, demos, and CI. It lets the MCP server exercise the DeltaV integration boundary without needing a live DeltaV Edge installation.

It is not a certified DeltaV Edge emulator.

## What It Supports

- simulated bearer-token authentication
- graph collection and graph-by-entity routes
- history collection and history-by-parameter routes
- alarms/events filtering and pagination
- batch-event filtering and pagination
- empty, delayed, malformed, and error-response simulation
- UI metadata routes used by the browser app
- static serving of the built UI bundle

## What It Does Not Support

- live DeltaV control
- production writes
- real enterprise identity integration
- guaranteed parity with every installed DeltaV Edge environment
- controller downloads or other write-like workflows

## Routes

Default mock routes:

- `POST /edge/api/v1/Login/GetAuthToken/profile`
- `POST /edge/api/v1/Login/GetAuthToken/activedirectory`
- `GET /edge/api/v1/graph`
- `GET /edge/api/v1/graph/:entityId`
- `GET /edge/api/v1/history`
- `GET /edge/api/v1/history/:paramId`
- `GET /edge/api/v1/ae`
- `GET /edge/api/v1/batchevent`
- `GET /api/mock-ui/status`
- `GET /api/mock-ui/scenarios`
- `GET /api/mock-ui/systems`
- `GET /api/mock-ui/connection-helper`
- `GET /health`

Real site paths must still be confirmed against installed DeltaV Edge documentation.

## Run The Mock

Local development:

```bash
npm run dev:mock
```

Build only:

```bash
npm run build:mock
```

Docker:

```bash
docker compose up --build mock-deltav-edge
```

Default addresses:

- health: `http://localhost:8080/health`
- UI: `http://localhost:8080/`
- API base path: `http://localhost:8080/edge/api/v1`

## Point The MCP Server At The Mock

Use settings like:

```env
DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/
DELTAV_USE_MOCK=true
DELTAV_EDGE_VERIFY_TLS=false
DELTAV_EDGE_ENDPOINT_AUTH_TOKEN=/api/v1/Login/GetAuthToken/profile
DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION=/api/v1/graph
DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY=/api/v1/graph/{entityId}
DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION=/api/v1/history
DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID=/api/v1/history/{entityId}
DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS=/api/v1/ae
DELTAV_EDGE_ENDPOINT_BATCH_EVENTS=/api/v1/batchevent
```

## Mock Data

Source data lives under `mock-deltav-edge/src/data/`.

Primary files:

- `graph.json`
- `history.json`
- `alarms-events.json`
- `batch-events.json`
- `failure-scenarios.json`
- `systems/*.json`

Edit those files to extend demo systems, alarm scenarios, and process trends.

## Browser UI

The mock service also serves a React/Vite UI from `/`.

Main views:

- Home / Status
- API Explorer
- Hierarchy Graph
- Module Relationship View
- Trend Viewer
- Trend Pack Viewer
- Alarm/Event Explorer
- Alarm Analytics
- Batch Timeline
- Batch Comparison
- Failure Scenario Viewer
- Mermaid Diagram Preview
- MCP Connection Helper

UI stack:

- React
- Vite
- React Flow
- Apache ECharts
- Mermaid
- TanStack Table

Use the UI for:

- confirming the mock service is healthy
- checking graph, history, alarm, and batch payload shapes
- browsing demo systems before issuing MCP tool calls
- reproducing mock failure scenarios interactively
- previewing Mermaid output from diagram tools

## Error Simulation

Supported request controls:

- `x-mock-error: 401|403|404|408|429|500`
- `x-mock-delay-ms: 2000`
- `x-mock-malformed: true`
- `x-mock-empty: true`

Equivalent query-string toggles are also supported:

- `mockError`
- `mockDelayMs`
- `mockMalformed`
- `mockEmpty`

These are intended for client robustness testing and MCP integration tests.

## Typical Local Flow

1. Start the mock with `npm run dev:mock`.
2. Open `http://localhost:8080/` and confirm the status page loads.
3. Point the MCP server at `http://localhost:8080/edge/`.
4. Enable `DELTAV_USE_MOCK=true` and apply the `/api/v1/*` endpoint overrides.
5. Run `npm run dev` for the MCP server.
6. Use MCP tools or `npm test` against the same mock-backed routes.

## Development-Only Warning

Use this mock only for development, testing, demos, and CI. It is not a validated plant simulator and must not be treated as production-compatibility proof.
