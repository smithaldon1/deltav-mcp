# Tools

This document lists the MCP tools registered by `src/tools/registerTools.ts`, grouped by purpose. All tool calls are audited. Live-write actions are not supported.

## Core DeltaV Read Tools

### `deltav_auth_status`

Purpose:

- verifies that the server can authenticate to DeltaV Edge
- returns a sanitized status only

Input:

```json
{}
```

Output shape:

- `authenticated`
- `baseUrl`
- `verifyTls`
- `tokenCached`
- `useMock`

Safety notes:

- no password or token is returned
- forces a fresh authentication attempt before reporting status

### `deltav_search_graph`

Purpose:

- search or browse the DeltaV graph and hierarchy

Input:

```json
{
  "query": "TIC-301",
  "area": "AREA_B",
  "limit": 25
}
```

Validation:

- `limit` between `1` and `100`
- allowlist enforcement on `area`

Safety notes:

- read-only
- fail-closed if `DELTAV_ALLOWED_AREAS` blocks the request

### `deltav_get_node_context`

Purpose:

- retrieve metadata and context for a DeltaV entity

Input:

```json
{
  "entityId": "TIC-301",
  "area": "AREA_B",
  "entityPath": "DemoDeltaVSystem/AREA_B/REACTOR_01/TIC-301"
}
```

Validation:

- `entityId` required
- allowlist enforcement on area and entity

### `deltav_get_history`

Purpose:

- retrieve historical values with summary statistics

Input:

```json
{
  "entityId": "TIC-301/PV",
  "start": "2026-05-06T11:00:00.000Z",
  "end": "2026-05-06T12:00:00.000Z",
  "maxPoints": 500
}
```

Validation:

- ISO datetime strings required
- max history range: `14` days
- `maxPoints` between `1` and `10000`
- allowlist enforcement on area and entity

Output shape:

- history payload from DeltaV client
- `summary` with `count`, `min`, `max`, `average`
- `empty`
- optional `message` when no values are returned

### `deltav_get_alarms_events`

Purpose:

- retrieve alarms and events with paging

Input:

```json
{
  "start": "2026-05-06T11:00:00.000Z",
  "end": "2026-05-06T12:10:00.000Z",
  "area": "AREA_B",
  "entityId": "TIC-301",
  "page": 1,
  "pageSize": 100
}
```

Validation:

- ISO datetime strings required
- max alarm range: `7` days
- `page` minimum `1`
- `pageSize` between `1` and `500`
- allowlist enforcement on area and entity

## OPC UA Tools

These tools are registered in every mode but require `DELTAV_DATA_SOURCE=OPCUA` to execute successfully.

### `opcua_discover_endpoints`

Purpose:

- discover endpoint URLs, security modes, security policies, and identity-token types

### `opcua_test_connection`

Purpose:

- verify that the configured security/auth settings can open a session

### `opcua_get_namespace_array`

Purpose:

- read the namespace array from the connected OPC UA server

### `opcua_get_server_status`

Purpose:

- read the standard server-status node and return a sanitized summary

### `opcua_browse_node`

Purpose:

- browse forward references from a node

### `opcua_read_node`

Purpose:

- read one node value

### `opcua_read_nodes`

Purpose:

- read multiple node values in one bounded request

Validation:

- request count must not exceed `DELTAV_OPCUA_MAX_NODES_PER_READ`

### `opcua_translate_path`

Purpose:

- translate a browse path into target node IDs

### `opcua_sample_nodes_for_window`

Purpose:

- collect bounded point-in-time samples over a requested window

Safety notes:

- this is sampled client-side data collection, not historian-backed history

### `opcua_monitor_nodes_for_window`

Purpose:

- capture a finite set of monitored-item notifications over a bounded duration

Safety notes:

- requires `DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS=true`
- does not open an unbounded live stream to MCP clients

## Investigation Tools

These tools support evidence-driven troubleshooting. They do not prove causation and they do not write to DeltaV.

### `deltav_get_trend_pack`

Purpose:

- fetch multiple trend series in one request set

Input:

```json
{
  "entityIds": ["TIC-301/PV", "TIC-301/SP"],
  "start": "2026-05-06T10:00:00.000Z",
  "end": "2026-05-06T12:00:00.000Z",
  "maxPoints": 120
}
```

Validation:

- `entityIds` required
- max range: `14` days
- `maxPoints` between `10` and `1000`

### `deltav_generate_event_timeline`

Purpose:

- combine alarms/events and optional history markers into a single timeline

Input:

```json
{
  "start": "2026-05-06T10:00:00.000Z",
  "end": "2026-05-06T12:00:00.000Z",
  "area": "AREA_B",
  "entityId": "TIC-301/PV"
}
```

### `deltav_correlate_alarms_with_history`

Purpose:

- compare alarm timestamps against nearby history values

Output notes:

- correlation is timestamp-proximity only
- summary explicitly states it does not prove causation

### `deltav_find_first_out`

Purpose:

- identify the earliest candidate alarm/event in an abnormal window

Output notes:

- returns `certainty` as `candidate_only` or `no_evidence`

### `deltav_find_repeating_alarms`

Purpose:

- group repeated alarms or events by entity/module key

### `deltav_find_chattering_alarms`

Purpose:

- detect alarm groups whose repeated timestamps occur within a short window

### `deltav_summarize_abnormal_event`

Purpose:

- summarize alarms and likely areas of concern over a time window

### `deltav_compare_before_after_change`

Purpose:

- compare history summaries before and after a proposed change timestamp

Input:

```json
{
  "entityId": "TIC-301/PV",
  "changeTimestamp": "2026-05-06T11:30:00.000Z",
  "windowHours": 8,
  "maxPoints": 120
}
```

## Batch Tools

### `deltav_search_batches`

Purpose:

- query batch-event records within a time window

Input:

```json
{
  "start": "2026-05-06T10:00:00.000Z",
  "end": "2026-05-06T16:00:00.000Z",
  "recipe": "REACTOR_HEATUP",
  "batchId": "BATCH-1001",
  "unit": "REACTOR_01",
  "phase": "HEATUP",
  "page": 1,
  "pageSize": 100
}
```

### `deltav_get_batch_timeline`

Purpose:

- return the same batch-event data ordered chronologically

### `deltav_compare_batches`

Purpose:

- compare two batches by event count and status progression

Input:

```json
{
  "leftBatchId": "BATCH-1001",
  "rightBatchId": "BATCH-1002",
  "start": "2026-05-06T00:00:00.000Z",
  "end": "2026-05-07T00:00:00.000Z"
}
```

### `deltav_find_batch_deviation_window`

Purpose:

- locate likely deviation windows based on `HOLD`, `FAIL`, or `ABORT` events

### `deltav_summarize_phase_failures`

Purpose:

- summarize recurring hold, fail, or abort events

### `generate_phase_logic`

Purpose:

- generate offline proposed batch phase logic for review

Mode:

- `SANDBOX_ENGINEERING` only

Input:

```json
{
  "phaseName": "HEATUP",
  "unit": "REACTOR_01",
  "objectives": ["Ramp jacket temperature to target safely"],
  "permissives": ["Agitator running"],
  "holds": ["Operator hold request"],
  "abortConditions": ["Reactor high-high temperature"]
}
```

Safety notes:

- proposed artifact only
- not downloadable phase code

## Engineering Generation Tools

These tools are available only in `SANDBOX_ENGINEERING` unless otherwise noted.

Shared strategy schema fields used by several tools:

- `title`
- `area`
- `equipment`
- `objectives`
- `controlNarrativeRequirements`
- `alarms`
- `interlocks`
- `modes`
- `failureScenarios`
- `namingPrefix`

### `generate_control_narrative`

Purpose:

- generate an offline control narrative as Markdown text

Output shape:

- `artifactType`
- `content`
- `openQuestions`

### `generate_control_module_design`

Purpose:

- generate a proposed DeltaV control module design

Output shape:

- `artifactType`
- `moduleDesign`
- `markdown`
- `openQuestions`

Safety notes:

- output is not import-ready

### `generate_alarm_list`

Purpose:

- generate JSON and CSV-compatible alarm-list artifacts

Input:

```json
{
  "alarms": [
    {
      "name": "TIC301_HI",
      "condition": "Reactor temperature exceeds high limit",
      "priority": "HIGH",
      "operatorAction": "Reduce heat input and verify cooling availability.",
      "consequence": "Product quality loss and escalation toward trip conditions.",
      "rationalization": "Warn operator before interlock threshold."
    }
  ]
}
```

Output shape:

- `artifactType`
- `alarms`
- `csv`
- `openQuestions`

### `generate_interlock_matrix`

Purpose:

- generate a conservative cause-and-effect interlock matrix

Input:

```json
{
  "interlocks": [
    {
      "cause": "Reactor high-high temperature",
      "condition": "TIC-301 exceeds 180 C",
      "effect": "Trip heat input",
      "resetRequirement": "Manual reset after temperature returns to normal",
      "bypassAllowed": false,
      "notes": "Requires operations and engineering review."
    }
  ]
}
```

Output shape:

- `artifactType`
- `interlocks`
- `csv`
- `openQuestions`

### `generate_test_protocol`

Purpose:

- generate an offline FAT/SAT-style protocol

Output shape:

- `artifactType`
- `content`
- `openQuestions`

### `create_engineering_change_package`

Purpose:

- write a local multi-file engineering package under `DELTAV_PACKAGE_OUTPUT_DIR`

Input:

```json
{
  "packageName": "reactor-temp-control-update",
  "overwrite": false,
  "strategy": {
    "title": "Reactor temperature control update",
    "area": "AREA_B",
    "equipment": ["REACTOR_01", "TIC-301"],
    "objectives": ["Improve excursion response"],
    "controlNarrativeRequirements": [],
    "alarms": [],
    "interlocks": [],
    "modes": ["AUTO", "MANUAL"],
    "failureScenarios": ["Sensor failure"],
    "namingPrefix": "RCT"
  }
}
```

Generated files include:

- `control_narrative.md`
- `module_design.json`
- `module_design.md`
- `alarm_list.csv`
- `alarm_list.json`
- `interlock_matrix.csv`
- `interlock_matrix.json`
- `test_protocol.md`
- `moc_summary.md`
- `requirements_traceability_matrix.csv`
- `change_impact_assessment.md`
- `risk_review.md`
- `rollback_plan.md`
- `operator_training_notes.md`
- `commissioning_checklist.md`
- `pre_startup_review_checklist.md`
- `open_questions.md`
- `assumptions.md`
- `validation_report.json`

Safety notes:

- sandbox-only
- package path constrained to configured output directory
- overwrite disabled by default

## Review And Validation Tools

These tools analyze proposed artifacts and structured strategy inputs. They do not modify DeltaV.

### `review_control_narrative`

Input:

```json
{
  "content": "# Narrative ..."
}
```

Checks:

- operator-action coverage
- interlock and permissive mention

### `review_module_design`

Input:

- full strategy schema

Checks:

- naming-prefix compliance
- missing operating modes

### `review_alarm_list`

Input:

- `alarms` array

Checks:

- weak operator action text
- critical-priority consequence basis

### `review_interlock_matrix`

Input:

- `interlocks` array

Checks:

- missing reset behavior
- bypass usage requiring extra controls

### `review_test_protocol`

Input:

```json
{
  "content": "# FAT/SAT ..."
}
```

Checks:

- alarm testing coverage
- failure-scenario coverage

### `identify_missing_failure_modes`

Checks for gaps such as:

- sensor quality failures
- communication failures
- trip and interlock scenarios

### `identify_missing_operator_actions`

Checks for alarms with weak operator guidance.

### `identify_unsafe_assumptions`

Checks free-form text for issues such as:

- automatic restart assumptions
- bypass allowance
- missing human-review language

### `validate_control_strategy`

Purpose:

- validate a structured strategy input against site-standard checks and prohibited-action patterns

Input:

- full strategy schema

Safety notes:

- available in both modes
- validation output is advisory and review-oriented

## Pattern Tools

### `engineering_list_patterns`

Purpose:

- list available engineering patterns and summaries

Input:

```json
{}
```

### `engineering_get_pattern`

Purpose:

- retrieve a structured design pattern by name

Input:

```json
{
  "patternName": "reactor-temperature-control"
}
```

## Diagram Tools

All diagram tools are `SANDBOX_ENGINEERING` only and return Mermaid text rather than rendered images.

### `generate_module_relationship_diagram`

Input:

```json
{
  "title": "Reactor Loop",
  "entities": ["REACTOR_01", "TIC-301", "TV-301"]
}
```

### `generate_cause_effect_diagram`

Input:

- `title`
- `entities`

### `generate_sequence_logic_diagram`

Input:

```json
{
  "title": "Heatup Sequence",
  "steps": ["Verify permissives", "Enable heat", "Monitor ramp", "Hold at target"]
}
```

### `generate_mode_state_diagram`

Input:

- `title`
- `steps`

### `generate_batch_phase_diagram`

Input:

- `title`
- `steps`

### `generate_alarm_response_diagram`

Input:

- `title`
- `steps`

## Prompts And Resources

The MCP server also registers prompts and resources.

Prompts:

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

Resources:

- `deltav://standards/naming-conventions`
- `deltav://standards/alarm-philosophy`
- `deltav://standards/module-templates/pid-loop`
- `deltav://standards/module-templates/motor`
- `deltav://standards/module-templates/valve`
- `deltav://templates/control-narrative`
- `deltav://templates/fat-sat`
- `deltav://templates/moc`
- `deltav://templates/validation`
