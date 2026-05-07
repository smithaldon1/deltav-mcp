# OPC UA Adapter

## Current State

This repository now includes a working read-only OPC UA adapter under:

- `src/datasources/opcua/`
- `src/datasources/dataSourceFactory.ts`

The implementation uses `node-opcua` for:

- endpoint discovery
- session creation and auth
- namespace array reads
- browse
- single-node and multi-node value reads
- browse-path translation
- bounded sampling windows
- bounded monitored-item capture windows

## Design Intent

The adapter boundary is intended to let the MCP tools work against:

- `EDGE_REST`
- `MOCK_EDGE_REST`
- `OPCUA`

without coupling the tool layer to one specific transport.

The adapter boundary keeps the MCP tool layer transport-agnostic while allowing DeltaV-style logical identifiers to resolve through `config/opcua-node-map.json`.

## Safety Model

The OPC UA path must remain read-only.

It must not:

- write node values
- call mutating methods
- acknowledge alarms
- modify setpoints
- bypass interlocks

`DELTAV_OPCUA_ENABLE_WRITES=false` is retained as an explicit guardrail signal.

Unsupported in this checkout:

- OPC UA writes
- mutating method calls
- alarm acknowledgement
- production control actions
- guaranteed historian-backed history parity
