# deltav-edge-mcp-server

Safety-conscious TypeScript MCP server for Emerson DeltaV Edge read access, engineering investigation workflows, and offline engineering artifact generation.

## Safety First

This repository does not support autonomous live control of a DeltaV system.

Prohibited actions include:

- writing values to live controllers
- changing live setpoints
- forcing I/O
- acknowledging or disabling alarms
- bypassing interlocks
- downloading modules to production
- modifying SIS logic
- pushing generated logic to production

Supported operating modes:

- `READ_ONLY`
- `SANDBOX_ENGINEERING`

`SANDBOX_ENGINEERING` enables offline artifact generation only. It is not a production write mode.

Supported data sources:

- `EDGE_REST`
- `MOCK_EDGE_REST`
- `OPCUA`

## What The Server Includes

- DeltaV Edge authentication status checks
- hierarchy and graph search
- node context lookup
- history retrieval with summary statistics
- alarms and events retrieval
- batch event retrieval and batch-analysis helpers
- abnormal-event investigation helpers
- offline engineering generation tools
- offline review and validation tools
- Mermaid diagram generators
- local engineering package generation
- registered MCP prompts for engineering workflows
- registered MCP resources for site standards and templates
- a development-only mock DeltaV Edge REST API and browser UI
- datasource abstraction for Edge REST, mock REST, and OPC UA selection
- read-only `node-opcua` integration plus a development-only mock OPC UA server

## Architecture

```text
AI Client -> MCP Server -> DeltaV Edge REST API -> DeltaV Edge Environment -> DeltaV system replica/context
                                  |
                                  +-> Local site standards, prompts, resources, generated packages, and pattern library
```

The server talks to the DeltaV Edge REST boundary, not directly to live controllers.

## Repository Layout

```text
src/
  audit/
  config/
  deltav/
  engineering/
  prompts/
  resources/
  safety/
  server/
  tools/
  utils/
mock-deltav-edge/
  src/
  ui/
site-standards/
mock-opcua-server/
tests/
docs/
```

## Requirements

- Node.js `>=20.11.0`
- npm

## Install

```bash
npm install
```

## Running The Server

### Stdio transport

Default MCP mode:

```bash
npm run dev
```

Production-style local run from compiled output:

```bash
npm run build
npm start
```

### Streamable HTTP transport

Set:

```env
DELTAV_HTTP_ENABLED=true
DELTAV_HTTP_HOST=0.0.0.0
DELTAV_HTTP_PORT=3000
DELTAV_HTTP_PATH=/mcp
DELTAV_HTTP_STATELESS=true
```

Then run the server and use:

- MCP endpoint: `http://localhost:3000/mcp`
- health endpoint: `http://localhost:3000/healthz`

`DELTAV_HTTP_STATELESS=false` enables session IDs via the SDK transport.

## Mock DeltaV Edge

Run the local simulated API and UI:

```bash
npm run dev:mock
```

Endpoints:

- mock API health: `http://localhost:8080/health`
- mock UI: `http://localhost:8080/`
- default mock API base path: `http://localhost:8080/edge/api/v1`

The mock is for development, testing, demos, and CI only. It is not a certified DeltaV Edge emulator.

## Mock OPC UA

Run the local simulated OPC UA server:

```bash
npm run dev:mock-opcua
```

Default endpoint:

- `opc.tcp://localhost:4840/UA/DeltaVMock`

The mock server supports local endpoint discovery, browse, reads, and bounded monitored-item capture windows. It is for development, testing, demos, and CI only.

## Quick Start For Mock-Backed MCP

Use mock-oriented settings like:

```env
DELTAV_DATA_SOURCE=MOCK_EDGE_REST
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

The checked-in [.env.example](/Users/aldonsmith/Documents/Programming/deltav-mcp/.env.example) shows the full variable set. For mock mode, `DELTAV_USE_MOCK=true` and the endpoint overrides are the important switches.

## Environment Variables

Core connection and mode settings:

```env
DELTAV_DATA_SOURCE=MOCK_EDGE_REST
DELTAV_EDGE_BASE_URL=http://localhost:8080/edge/
DELTAV_EDGE_USERNAME=
DELTAV_EDGE_PASSWORD=
DELTAV_EDGE_VERIFY_TLS=true
DELTAV_USE_MOCK=false
DELTAV_MCP_MODE=READ_ONLY
DELTAV_ALLOWED_AREAS=
DELTAV_ALLOWED_ENTITIES=
DELTAV_AUDIT_LOG_PATH=./logs/audit.log
DELTAV_PACKAGE_OUTPUT_DIR=./generated-packages
```

Endpoint-path overrides:

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

Mock service settings:

```env
MOCK_DELTAV_EDGE_HOST=0.0.0.0
MOCK_DELTAV_EDGE_PORT=8080
MOCK_DELTAV_EDGE_BASE_PATH=/edge/api/v1
```

OPC UA settings:

```env
DELTAV_OPCUA_ENDPOINT_URL=opc.tcp://localhost:4840
DELTAV_OPCUA_SECURITY_MODE=None
DELTAV_OPCUA_SECURITY_POLICY=None
DELTAV_OPCUA_USERNAME=
DELTAV_OPCUA_PASSWORD=
DELTAV_OPCUA_APPLICATION_NAME=deltav-engineering-mcp-server
DELTAV_OPCUA_CERT_DIR=./certs/opcua
DELTAV_OPCUA_TRUST_UNKNOWN_CERTIFICATES=false
DELTAV_OPCUA_SESSION_TIMEOUT_MS=60000
DELTAV_OPCUA_REQUEST_TIMEOUT_MS=30000
DELTAV_OPCUA_MAX_NODES_PER_READ=100
DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS=true
DELTAV_OPCUA_ENABLE_WRITES=false
DELTAV_OPCUA_NODE_MAP_PATH=./config/opcua-node-map.json
```

Configuration is validated at startup. Package output and audit log paths must resolve inside the repository working directory.

## Codex MCP Configuration

Example stdio registration:

```toml
[mcp_servers.deltav_edge]
command = "node"
args = ["dist/index.js", "--transport", "stdio"]
cwd = "/absolute/path/to/deltav-edge-mcp-server"
startup_timeout_sec = 30
tool_timeout_sec = 120
enabled = true

[mcp_servers.deltav_edge.env]
DELTAV_DATA_SOURCE = "MOCK_EDGE_REST"
DELTAV_EDGE_BASE_URL = "http://localhost:8080/edge/"
DELTAV_EDGE_USERNAME = "demo"
DELTAV_EDGE_PASSWORD = "demo"
DELTAV_EDGE_VERIFY_TLS = "false"
DELTAV_USE_MOCK = "true"
DELTAV_MCP_MODE = "READ_ONLY"
DELTAV_AUDIT_LOG_PATH = "./logs/audit.log"
DELTAV_PACKAGE_OUTPUT_DIR = "./generated-packages"
```

`Auth: Unsupported` is normal for a local stdio MCP server. If Codex shows `Tools: (none)`, check build output, `cwd`, stdout logging, and the troubleshooting guide in [docs/TROUBLESHOOTING.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/TROUBLESHOOTING.md).

## OPC UA Status

The repository now includes a working read-only OPC UA client path, dedicated OPC UA MCP tools, a checked-in logical NodeId map, and a local `mock-opcua-server/` workspace. The implementation remains conservative:

- no OPC UA writes
- no mutating method calls
- no alarm acknowledgement
- bounded sampling and monitoring windows only
- no claim that sampled windows are historian-backed history

## Tool Surface

Core DeltaV read tools:

- `deltav_auth_status`
- `deltav_search_graph`
- `deltav_get_node_context`
- `deltav_get_history`
- `deltav_get_alarms_events`

Investigation tools:

- `deltav_get_trend_pack`
- `deltav_generate_event_timeline`
- `deltav_correlate_alarms_with_history`
- `deltav_find_first_out`
- `deltav_find_repeating_alarms`
- `deltav_find_chattering_alarms`
- `deltav_summarize_abnormal_event`
- `deltav_compare_before_after_change`

Batch tools:

- `deltav_search_batches`
- `deltav_get_batch_timeline`
- `deltav_compare_batches`
- `deltav_find_batch_deviation_window`
- `deltav_summarize_phase_failures`
- `generate_phase_logic`

Engineering generation tools:

- `generate_control_narrative`
- `generate_control_module_design`
- `generate_alarm_list`
- `generate_interlock_matrix`
- `generate_test_protocol`
- `create_engineering_change_package`

Review and validation tools:

- `review_control_narrative`
- `review_module_design`
- `review_alarm_list`
- `review_interlock_matrix`
- `review_test_protocol`
- `identify_missing_failure_modes`
- `identify_missing_operator_actions`
- `identify_unsafe_assumptions`
- `validate_control_strategy`

Pattern and diagram tools:

- `engineering_list_patterns`
- `engineering_get_pattern`
- `generate_module_relationship_diagram`
- `generate_cause_effect_diagram`
- `generate_sequence_logic_diagram`
- `generate_mode_state_diagram`
- `generate_batch_phase_diagram`
- `generate_alarm_response_diagram`

OPC UA tools:

- `opcua_discover_endpoints`
- `opcua_test_connection`
- `opcua_get_namespace_array`
- `opcua_get_server_status`
- `opcua_browse_node`
- `opcua_read_node`
- `opcua_read_nodes`
- `opcua_translate_path`
- `opcua_sample_nodes_for_window`
- `opcua_monitor_nodes_for_window`

See [docs/TOOLS.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/TOOLS.md) for details.

## Prompts And Resources

Registered prompts:

- `investigate_abnormal_event`
- `review_control_module_design`
- `generate_pump_control_strategy`
- `generate_pid_loop_design`
- `generate_alarm_rationalization`
- `generate_batch_phase_design`
- `generate_fat_sat_protocol`
- `generate_moc_package`
- `review_interlock_matrix`
- `compare_strategy_to_site_standard`

Registered resources:

- `deltav://standards/naming-conventions`
- `deltav://standards/alarm-philosophy`
- `deltav://standards/module-templates/pid-loop`
- `deltav://standards/module-templates/motor`
- `deltav://standards/module-templates/valve`
- `deltav://templates/control-narrative`
- `deltav://templates/fat-sat`
- `deltav://templates/moc`
- `deltav://templates/validation`

## Audit, Guardrails, And Access Control

- Every tool call writes an audit record with sanitized input, status, mode, and optional session ID.
- Natural-language live-write requests are refused with a structured safe alternative.
- `DELTAV_ALLOWED_AREAS` and `DELTAV_ALLOWED_ENTITIES` enforce fail-closed allowlists when configured.
- Generated packages are written only under `DELTAV_PACKAGE_OUTPUT_DIR`.

## Docker Compose

Start the full local stack:

```bash
docker compose up --build
```

Services:

- REST-backed MCP server on `http://localhost:3000/mcp`
- OPC UA-backed MCP server on `http://localhost:3101/mcp`
- mock API on `http://localhost:8080/health`
- mock UI on `http://localhost:8080/`
- mock OPC UA server on `opc.tcp://localhost:4840/UA/DeltaVMock`

The mock UI proxies tool calls explicitly to both MCP services:

- REST proxy: `/api/mcp/rest/tools/list` and `/api/mcp/rest/tools/call`
- OPC UA proxy: `/api/mcp/opcua/tools/list` and `/api/mcp/opcua/tools/call`

The generic `/api/mcp/tools/*` routes remain pointed at the OPC UA service for backwards compatibility with the current console defaults.

## Development Scripts

```bash
npm run dev
npm run dev:mock
npm run build
npm run build:mock
npm run build:mock-ui
npm test
npm run lint
```

## Testing

Primary repo checks:

```bash
npm test
npm run build
npm run lint
```

The test suite covers configuration, client request construction, mock-backed MCP flows, access control, guardrails, validation, package writing, and audit redaction.

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
        "DELTAV_EDGE_ENDPOINT_AUTH_TOKEN": "/api/v1/Login/GetAuthToken/profile",
        "DELTAV_EDGE_ENDPOINT_GRAPH_COLLECTION": "/api/v1/graph",
        "DELTAV_EDGE_ENDPOINT_GRAPH_ENTITY": "/api/v1/graph/{entityId}",
        "DELTAV_EDGE_ENDPOINT_HISTORY_COLLECTION": "/api/v1/history",
        "DELTAV_EDGE_ENDPOINT_HISTORY_BY_ID": "/api/v1/history/{entityId}",
        "DELTAV_EDGE_ENDPOINT_ALARMS_EVENTS": "/api/v1/ae",
        "DELTAV_EDGE_ENDPOINT_BATCH_EVENTS": "/api/v1/batchevent",
        "DELTAV_MCP_MODE": "READ_ONLY"
      }
    }
  }
}
```

## Documentation

- [docs/ARCHITECTURE.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/ARCHITECTURE.md)
- [docs/SAFETY_MODEL.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/SAFETY_MODEL.md)
- [docs/TOOLS.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/TOOLS.md)
- [docs/DELTAV_EDGE_SETUP.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/DELTAV_EDGE_SETUP.md)
- [docs/ENGINEERING_WORKFLOWS.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/ENGINEERING_WORKFLOWS.md)
- [docs/MOCK_DELTAV_EDGE.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/MOCK_DELTAV_EDGE.md)
- [docs/DIAGRAMS.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/DIAGRAMS.md)
- [docs/PATTERN_LIBRARY.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/PATTERN_LIBRARY.md)
- [docs/EXAMPLE_PROMPTS.md](/Users/aldonsmith/Documents/Programming/deltav-mcp/docs/EXAMPLE_PROMPTS.md)

## Known Limitations

- Real DeltaV Edge routes and payloads must be verified against installed site documentation.
- The mock server is a development aid, not a plant-validated emulator.
- Investigation outputs summarize evidence but do not prove causation.
- Generated artifacts, diagrams, reviews, and validation outputs remain proposed engineering material until qualified human review and site change control are complete.
