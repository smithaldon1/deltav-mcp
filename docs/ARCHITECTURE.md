# Architecture

## System Boundary

```text
AI Client -> MCP Server -> DeltaV Edge REST API -> DeltaV Edge Environment -> DeltaV system replica/context
                                  |
                                  +-> Local prompts, approved resources, pattern library, audit logs, and generated packages
```

The MCP server is the safety and integration boundary. It centralizes:

- configuration validation
- authentication and request construction
- access control
- prohibited-action guardrails
- audit logging
- offline engineering artifact generation

## Why The Server Does Not Talk To Controllers Directly

This repository is intentionally constrained to the DeltaV Edge REST boundary and local offline workflows.

It does not:

- write controller values
- change live setpoints
- acknowledge or disable alarms
- force I/O
- bypass interlocks
- modify controller configuration
- download logic to production

That separation keeps the MCP surface aligned with process safety, cybersecurity, change control, and human engineering review expectations.

## Main Runtime Components

### Configuration

`src/config/env.ts` validates required environment variables at startup, normalizes booleans and lists, and resolves audit/package paths inside the repository working directory.

### DeltaV client

`src/deltav/DeltaVEdgeClient.ts` isolates REST API access behind methods including:

- `authenticate()`
- `getAuthStatus()`
- `searchGraph()`
- `getGraphByEntityId()`
- `getHistoryById()`
- `getAlarmsEvents()`
- `getBatchEvents()`

The client:

- resolves endpoint maps from configuration
- caches the bearer token in memory
- applies request timeouts
- supports disabled TLS verification for controlled non-production use
- returns structured, redacted client errors

### MCP server registration

`src/server/createServer.ts` creates the `McpServer` and registers:

- tools
- prompts
- resources

### Transports

`src/server/transports.ts` supports:

- stdio transport for normal MCP client integration
- streamable HTTP transport for HTTP-based MCP access

The HTTP transport also exposes `/healthz`.

### Safety layer

`src/safety/` contains:

- allowlist enforcement in `accessControl.ts`
- prohibited-action pattern detection in `prohibitedActions.ts`
- generic inspection helpers in `guardrails.ts`

### Audit layer

`src/audit/auditLogger.ts` appends newline-delimited JSON audit entries with:

- timestamp
- tool name
- sanitized input
- status
- error summary
- mode
- caller session when available

## Capability Layers

### Read and investigation layer

Read-oriented tools retrieve:

- authentication status
- graph and node context
- history
- alarms and events
- batch events

Investigation helpers summarize:

- multi-tag trend packs
- event timelines
- alarm-to-history timestamp proximity
- first-out candidates
- repeating or chattering alarms
- before/after change comparisons

### Engineering generation layer

Sandbox-only tools generate offline artifacts such as:

- control narratives
- module designs
- alarm lists
- interlock matrices
- FAT/SAT-style protocols
- batch phase logic proposals
- Mermaid diagrams
- multi-file engineering change packages

### Review and validation layer

Review tools and validators inspect proposed strategies for:

- naming compliance
- missing modes
- weak operator actions
- incomplete interlock reset behavior
- missing failure scenarios
- unsafe assumptions
- live-write-like phrases

## Prompts And Resources

Beyond tools, the server exposes:

- reusable engineering prompts under `src/prompts/`
- approved standards and templates under `src/resources/registerResources.ts`
- structured design patterns under `src/engineering/patterns/`

These support consistent offline engineering assistance without expanding the live-control boundary.

## Mock Environment

`mock-deltav-edge/` provides a development-only simulated REST API and browser UI. It mirrors the same integration pattern used by the MCP server:

- auth endpoint
- graph routes
- history routes
- alarms/events route
- batch events route
- UI metadata routes

It is useful for development, demos, and CI, but it is not a certified DeltaV Edge emulator.
