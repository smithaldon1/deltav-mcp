# Mock DeltaV Edge

## Purpose

`mock-deltav-edge` is a local simulated REST API for development, testing, demos, and CI. It allows the MCP server to operate without a real DeltaV Edge installation.

This mock is not a certified DeltaV Edge emulator.

## What It Supports

- fake bearer-token authentication
- graph queries by id and path
- runtime parameter fields like `CV`, `ST`, `MODE`, `OUT`, `SP`, `PV`, `ALM_STATE`, `QUALITY`
- deterministic history generation with multiple process-behavior scenarios
- alarms/events filtering and pagination
- batch-event filtering and pagination
- error, delay, malformed-response, and empty-result simulation
- a lightweight browser UI for browsing and testing the mock endpoints

## What It Does Not Support

- live DeltaV control
- real authentication or enterprise identity integration
- certified endpoint parity with every DeltaV Edge installation
- controller downloads or write-like behavior

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
- `GET /health`

These are development assumptions only. Real site routes must still be confirmed against installed DeltaV Edge documentation.

## Run It

```bash
npm run dev:mock
```

Or with Docker:

```bash
docker compose up --build mock-deltav-edge
```

Health endpoint:

```text
http://localhost:8080/health
```

Web UI:

```text
http://localhost:8080/
```

## Point the MCP Server at the Mock

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

## Add Sample Data

Mock source data lives under `mock-deltav-edge/src/data/`.

- `graph.json`
- `history.json`
- `alarms-events.json`
- `batch-events.json`
- `systems/*.json`

Add or edit entities, scenarios, and records there.

## Web UI

The mock service serves a lightweight React/Vite UI from the root path.

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

Visualization stack:

- React Flow for hierarchy and relationship graphs
- Apache ECharts for trend and analytics views
- Mermaid for engineering diagram previews
- TanStack Table for alarms, events, batch records, and findings

Use the UI for:

- confirming the mock base URL and auth behavior
- interactively browsing demo systems and entity relationships
- checking history, alarm, event, and batch payloads before using MCP tools
- reproducing mock error scenarios and request headers
- demoing generated Mermaid engineering diagrams without external rendering services

Limitations:

- no write-like controls
- no live DeltaV connectivity
- no arbitrary file reads
- no arbitrary URL fetching
- not a plant simulator or certified DeltaV Edge emulator

## Simulate Errors

Headers and query toggles supported:

- `x-mock-error: 401|403|404|408|429|500`
- `x-mock-delay-ms: 2000`
- `x-mock-malformed: true`
- `x-mock-empty: true`

These are intended for client and MCP integration tests.

The web UI includes an Error Simulation panel that shows the exact header combinations needed to reproduce those behaviors.

## MCP Testing Against the Mock

Typical local flow:

1. Start the mock API with `npm run dev:mock`.
2. Open `http://localhost:8080/` and confirm the status page and demo systems load.
3. Point the MCP server at `http://localhost:8080/edge/` using the mock endpoint variables.
4. Use the API Explorer or History/Alarm/Batch views to confirm the payload shape you expect.
5. Run MCP tools or `npm test` to exercise the same mock-backed routes under automation.

## Development-Only Warning

Use this mock only for development, testing, demos, and CI. It is not a validated plant simulator and must not be treated as a production compatibility guarantee.
