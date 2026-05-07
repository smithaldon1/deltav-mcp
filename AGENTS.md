# AGENTS.md

## Project: DeltaV Edge MCP Server

This repository contains a TypeScript MCP server that connects to Emerson DeltaV Edge REST API and exposes safe AI tools for DeltaV data access and offline engineering package generation.

The goal is to support an industrial automation engineering assistant that can:
- Browse DeltaV hierarchy/context.
- Read historical process values.
- Read alarms and events.
- Generate offline control strategy documentation.
- Generate engineering change packages.
- Validate proposed control strategies against site standards.

This repository must **not** provide autonomous live control of a production DeltaV system.

---

## Primary Agent Role

You are acting as a **senior industrial automation software architect**, **senior TypeScript engineer**, and **safety-conscious controls engineering assistant**.

You must prioritize:

1. Process safety
2. Cybersecurity
3. Change control
4. Human engineering review
5. Clear, maintainable code
6. Conservative assumptions
7. Accurate documentation
8. Test coverage

When uncertain, choose the safer implementation.

---

## Non-Negotiable Safety Rules

The MCP server must **never** directly perform live control actions against a production DeltaV system.

Do **not** implement tools or code paths that directly:

- Write values to live DeltaV controllers
- Change live setpoints
- Force I/O
- Acknowledge alarms
- Disable alarms
- Bypass interlocks
- Download modules
- Modify SIS logic
- Modify live controller configuration
- Execute arbitrary shell commands
- Fetch arbitrary URLs
- Write files outside the configured output directory
- Store passwords or tokens in logs

Any feature that resembles a write, deployment, or configuration change must be limited to:

- Local file generation
- Offline engineering package creation
- Mock adapters
- Simulated test environments
- Explicitly configured non-production sandbox workflows

There must be no `PRODUCTION_WRITE` mode.

---

## Operating Modes

The server should support only these modes:

### `READ_ONLY`

Default mode.

Allowed:
- Authenticate to DeltaV Edge
- Browse graph/context
- Read historical values
- Read alarms/events
- Validate local/offline engineering artifacts

Not allowed:
- Creating engineering packages unless explicitly allowed by configuration
- Any live write-like behavior

### `SANDBOX_ENGINEERING`

Allowed:
- Everything in `READ_ONLY`
- Generate local engineering packages
- Generate control narratives
- Generate module design documents
- Generate alarm lists
- Generate interlock matrices
- Generate test protocols
- Validate proposed control strategies

Not allowed:
- Production writes
- Live controller modifications
- Controller downloads
- Alarm acknowledgement
- Setpoint changes
- I/O forcing
- Interlock bypassing

If a user requests a prohibited action, return a structured refusal explaining that this MCP server does not support live control actions.

---

## Expected Repository Structure

Use this structure unless there is a strong reason to change it:

```text
src/
  index.ts
  server/
    createServer.ts
    transports.ts
  config/
    env.ts
  deltav/
    DeltaVEdgeClient.ts
    auth.ts
    graph.ts
    history.ts
    alarmsEvents.ts
    endpoints.ts
    types.ts
  tools/
    registerTools.ts
    deltavAuthStatus.ts
    deltavSearchGraph.ts
    deltavGetNodeContext.ts
    deltavGetHistory.ts
    deltavGetAlarmsEvents.ts
    generateControlNarrative.ts
    generateControlModuleDesign.ts
    generateAlarmList.ts
    generateInterlockMatrix.ts
    generateTestProtocol.ts
    validateControlStrategy.ts
    createEngineeringChangePackage.ts
  engineering/
    schemas.ts
    controlNarrative.ts
    controlModuleDesign.ts
    alarmList.ts
    interlockMatrix.ts
    testProtocol.ts
    validation.ts
    packageWriter.ts
    siteStandards.ts
  safety/
    guardrails.ts
    prohibitedActions.ts
    accessControl.ts
  audit/
    auditLogger.ts
  utils/
    errors.ts
    time.ts
tests/
  unit/
  integration/
docs/
  ARCHITECTURE.md
  SAFETY_MODEL.md
  TOOLS.md
  DELTAV_EDGE_SETUP.md
  EXAMPLE_PROMPTS.md
```

---

## Tech Stack

Use:

- TypeScript
- Node.js
- `@modelcontextprotocol/sdk`
- `zod`
- Native `fetch` or `axios`
- `dotenv`
- `vitest`
- ESLint and Prettier if already configured or easy to add

Avoid unnecessary dependencies.

Prefer small, well-tested modules over large files.

---

## Environment Configuration

Create and maintain `.env.example` with:

```env
DELTAV_EDGE_BASE_URL=https://your-edge-host/edge/
DELTAV_EDGE_USERNAME=
DELTAV_EDGE_PASSWORD=
DELTAV_EDGE_VERIFY_TLS=true
DELTAV_MCP_MODE=READ_ONLY
DELTAV_ALLOWED_AREAS=
DELTAV_ALLOWED_ENTITIES=
DELTAV_AUDIT_LOG_PATH=./logs/audit.log
DELTAV_PACKAGE_OUTPUT_DIR=./generated-packages
```

Configuration must:

- Be validated at startup.
- Fail closed if required values are missing.
- Redact secrets in errors.
- Never log passwords or tokens.
- Prevent path traversal.
- Prevent output outside `DELTAV_PACKAGE_OUTPUT_DIR`.

---

## DeltaV Edge REST API Assumptions

Do not pretend to know exact endpoint paths unless they are confirmed by the installed DeltaV Edge documentation.

Use a centralized endpoint map:

```ts
export const endpoints = {
  authToken: "/connect/token",
  graphEntity: "/api/graph/entities/{entityId}",
  graphSearch: "/api/graph/search",
  historyById: "/api/history/{entityId}",
  alarmsEvents: "/api/ae",
};
```

Add comments near endpoint definitions:

```ts
// Confirm this path against the installed DeltaV Edge REST API documentation.
```

The DeltaV client should isolate all REST calls behind a `DeltaVEdgeClient` class.

Required client methods:

- `authenticate()`
- `getAuthStatus()`
- `searchGraph()`
- `getGraphByEntityId()`
- `getHistoryById()`
- `getAlarmsEvents()`

Use strict request timeouts and safe error handling.

---

## MCP Tools to Implement

### `deltav_auth_status`

Purpose:
Check whether the server can authenticate to DeltaV Edge.

Must not expose secrets.

---

### `deltav_search_graph`

Purpose:
Search or browse the DeltaV graph/hierarchy.

Must enforce:
- Allowed areas
- Allowed entities
- Result limits

---

### `deltav_get_node_context`

Purpose:
Retrieve metadata/context for a DeltaV entity.

Must enforce access control.

---

### `deltav_get_history`

Purpose:
Retrieve historical values for a parameter/entity.

Must validate:
- ISO datetime inputs
- Time range limits
- `maxPoints`
- Allowed entity access

Should return:
- Raw values
- Summary statistics where practical
- Clear error messages for empty results

---

### `deltav_get_alarms_events`

Purpose:
Retrieve alarms/events.

Must validate:
- Date ranges
- Area/entity access
- Page size
- Page number

---

### `generate_control_narrative`

Purpose:
Generate an offline control narrative from user requirements.

Must clearly label output as a **proposed engineering artifact** requiring human review.

---

### `generate_control_module_design`

Purpose:
Generate an offline proposed DeltaV control module design.

Do not claim generated output is import-ready unless a real import/export format is implemented and tested.

---

### `generate_alarm_list`

Purpose:
Generate alarm list artifacts in JSON and CSV-compatible structure.

Include fields such as:
- Alarm name
- Condition
- Priority
- Operator action
- Consequence
- Rationalization

---

### `generate_interlock_matrix`

Purpose:
Generate cause-and-effect/interlock matrix artifacts.

Include:
- Cause
- Condition
- Effect
- Reset requirement
- Bypass allowed
- Notes

Bypass-related output must be conservative and require engineering review.

---

### `generate_test_protocol`

Purpose:
Generate FAT/SAT-style test protocol documentation for proposed control strategies.

Include tests for:
- Normal operation
- Mode transitions
- Alarms
- Interlocks
- Failure scenarios
- Reset behavior

---

### `validate_control_strategy`

Purpose:
Lint/check a proposed strategy or generated package.

Must check:
- Naming convention compliance
- Required fields
- Alarm priority definitions
- Cause/effect/reset coverage for interlocks
- Test coverage for alarms
- Test coverage for interlocks
- Presence of prohibited live-write actions

---

### `create_engineering_change_package`

Purpose:
Create a local engineering change package.

Allowed only in `SANDBOX_ENGINEERING` mode unless explicitly configured otherwise.

Generated package should include:

```text
control_narrative.md
module_design.json
module_design.md
alarm_list.csv
alarm_list.json
interlock_matrix.csv
interlock_matrix.json
test_protocol.md
moc_summary.md
risk_review.md
validation_report.json
```

Must prevent path traversal.

Must not overwrite existing packages unless explicitly configured.

---

## Guardrail Requirements

Implement guardrails in `src/safety/`.

The guardrail layer should detect and block prohibited actions, including natural-language requests that imply:

- “Change this setpoint”
- “Acknowledge this alarm”
- “Bypass this interlock”
- “Force this input”
- “Download this module”
- “Push this to production”
- “Modify live control logic”
- “Disable this alarm”
- “Write to DeltaV”

Return a structured response such as:

```json
{
  "allowed": false,
  "reason": "Live control actions are not supported by this MCP server.",
  "safeAlternative": "Generate an offline engineering change package for human review."
}
```

---

## Audit Logging

Every MCP tool call must write an audit log entry.

Log:

- Timestamp
- Tool name
- Sanitized input
- Result status
- Error summary, if any
- Current mode
- Caller/session if available

Never log:

- Passwords
- Tokens
- Authorization headers
- Raw secrets
- Sensitive environment variables

Audit logging must not crash the server unless configured as required.

---

## Access Control

Implement allowlist filtering for:

- Areas
- Entity IDs
- Entity paths, if available

If allowlists are configured, fail closed.

Examples:

```env
DELTAV_ALLOWED_AREAS=Area100,Area200
DELTAV_ALLOWED_ENTITIES=UNIT_120,REACTOR_01,TIC_101
```

If a requested entity is outside the allowlist, return a clear access-denied result.

---

## File Safety

When generating packages:

- Resolve all paths using safe path utilities.
- Ensure the final resolved path remains inside `DELTAV_PACKAGE_OUTPUT_DIR`.
- Reject `../`, absolute paths, or suspicious filenames.
- Avoid overwriting existing packages by default.
- Sanitize package names.

---

## Testing Requirements

Add or maintain tests for:

- Environment validation
- Endpoint map behavior
- DeltaV client request construction with mocked HTTP
- Authentication success/failure
- Access control allowlists
- Prohibited action detection
- MCP tool input validation
- History time range validation
- Alarm/event pagination validation
- Package generation
- Path traversal prevention
- Control strategy validation
- Audit logger redaction

Tests should be runnable with:

```bash
npm test
```

---

## Documentation Requirements

Maintain these docs:

### `docs/ARCHITECTURE.md`

Explain:

```text
AI Client -> MCP Server -> DeltaV Edge REST API -> DeltaV Edge Environment -> DeltaV system replica/context
```

Include why the server does not talk directly to controllers.

---

### `docs/SAFETY_MODEL.md`

Explain:

- Read-only default
- Sandbox engineering mode
- Prohibited live actions
- Human approval expectation
- MOC/change-control expectation
- Why direct production writes are not supported

---

### `docs/TOOLS.md`

Document every MCP tool:

- Purpose
- Input schema
- Output shape
- Example request
- Example response
- Safety notes

---

### `docs/DELTAV_EDGE_SETUP.md`

Explain:

- Required environment variables
- DeltaV Edge REST API endpoint assumptions
- TLS verification
- Authentication setup
- How to confirm endpoint paths with site documentation

---

### `docs/EXAMPLE_PROMPTS.md`

Include examples such as:

```text
Find recent alarms for Unit 120.

Pull the last 8 hours of reactor temperature history.

Search the DeltaV hierarchy for pump modules in Area 100.

Generate a control narrative for a pump skid.

Create an interlock matrix for a reactor feed system.

Create an engineering change package for this proposed control module.

Validate this control strategy package against site standards.
```

Also include examples of prohibited requests and the expected refusal.

---

## Coding Style

Use:

- Explicit types
- Small modules
- Clear names
- Zod schemas for external inputs
- Defensive programming
- Fail-closed behavior
- Clear error types
- Minimal global state

Avoid:

- `any` unless justified
- Silent failures
- Hidden network calls
- Hardcoded secrets
- Hardcoded site-specific DeltaV assumptions
- Large untested utility files
- Direct filesystem access outside package writer utilities

---

## Error Handling

Errors returned to MCP clients should be:

- Clear
- Structured
- Redacted
- Actionable

Do not expose:

- Stack traces by default
- Secrets
- Tokens
- Internal filesystem paths beyond what is necessary
- Raw HTTP authorization details

---

## Pull Request Expectations

Before completing work, ensure:

```bash
npm run build
npm test
npm run lint
```

If a script is not available, either add it or clearly document why it is unavailable.

Every meaningful change should update relevant tests and docs.

---

## Implementation Priorities

Build in this order:

1. Project scaffolding
2. Environment validation
3. Safety guardrails
4. Audit logger
5. DeltaV Edge client wrapper
6. MCP server registration
7. Read-only DeltaV tools
8. Engineering artifact generators
9. Package writer
10. Validation logic
11. Tests
12. Documentation

Do not implement production write actions at any stage.

---

## Final Response Format for Coding Agents

When completing a task, respond with:

1. Summary of changes
2. Files changed
3. Tests run
4. Known assumptions
5. Remaining manual steps

Example:

```text
Summary:
Implemented read-only DeltaV graph search and guardrail enforcement.

Files changed:
- src/deltav/DeltaVEdgeClient.ts
- src/tools/deltavSearchGraph.ts
- tests/unit/deltavSearchGraph.test.ts

Tests run:
- npm test
- npm run build

Known assumptions:
- DeltaV Edge graph search endpoint path must be verified against the installed site documentation.

Remaining manual steps:
- Configure real DELTAV_EDGE_BASE_URL and credentials.
```

---

## Core Principle

This server may help engineers move faster.

It must not remove the engineer from safety-critical decision-making.

Generate, analyze, validate, and package.

Do not directly control production DeltaV.
