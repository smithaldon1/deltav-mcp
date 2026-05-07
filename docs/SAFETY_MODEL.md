# Safety Model

## Core Principle

This server may help engineers move faster.

It must not remove engineers from safety-critical decision-making.

The server is allowed to generate, analyze, review, validate, and package offline material. It is not allowed to directly control a production DeltaV system.

## Supported Modes

- `READ_ONLY`
- `SANDBOX_ENGINEERING`

`READ_ONLY` is the default.

## READ_ONLY

Allowed:

- DeltaV Edge authentication
- graph browsing and search
- node-context retrieval
- historical value reads
- alarms/events reads
- batch-event reads
- read-only investigation helpers
- offline review and validation of proposed artifacts
- access to engineering patterns, prompts, and approved standards resources

Not allowed:

- engineering package creation
- offline generation of new deliverables
- Mermaid engineering diagram generation
- phase-logic generation
- any live-write-like behavior

## SANDBOX_ENGINEERING

Allowed in addition to `READ_ONLY`:

- offline control narratives
- offline control module designs
- offline alarm lists
- offline interlock matrices
- offline FAT/SAT protocols
- offline phase logic proposals
- Mermaid engineering diagrams
- local engineering change package generation

Not allowed:

- production writes
- live controller modification
- alarm acknowledgement
- setpoint changes
- I/O forcing
- interlock bypass execution
- module downloads
- SIS modifications

## Guardrails

The safety layer blocks natural-language requests that imply prohibited live actions, including phrases such as:

- change this setpoint
- acknowledge this alarm
- bypass this interlock
- force this input
- download this module
- push this to production
- modify live control logic
- disable this alarm
- write to DeltaV

Expected refusal shape:

```json
{
  "allowed": false,
  "reason": "Live control actions are not supported by this MCP server.",
  "safeAlternative": "Generate an offline engineering change package for human review."
}
```

## Access Control

When configured, the server fails closed using:

- `DELTAV_ALLOWED_AREAS`
- `DELTAV_ALLOWED_ENTITIES`

Requests outside the configured allowlists return access-denied errors rather than partial results.

## File Safety

Generated packages are constrained to `DELTAV_PACKAGE_OUTPUT_DIR`.

Safety controls include:

- path resolution inside the repository working directory
- package output limited to the configured output directory
- path-traversal rejection
- sanitized package naming
- no overwrite unless explicitly requested

## Audit Logging

Every tool call writes an audit entry with sanitized fields only.

Logged:

- timestamp
- tool name
- sanitized input
- result status
- error summary
- current mode
- caller session if available

Never logged:

- passwords
- bearer tokens
- authorization headers
- raw secrets

## Human Review And Change Control

All generated artifacts are proposals only.

They require:

- qualified engineering review
- site MOC or equivalent change-control process
- site-specific standards review
- formal approval before implementation

The server intentionally stops at analysis and packaging. It does not perform implementation into a live control environment.
