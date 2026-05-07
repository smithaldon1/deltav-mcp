# Engineering Workflows

This server supports engineering-assistance workflows, not direct plant control. The patterns below show how the registered tools fit together.

## 1. Read-Only Investigation

Typical sequence:

1. `deltav_auth_status`
2. `deltav_search_graph`
3. `deltav_get_node_context`
4. `deltav_get_history`
5. `deltav_get_alarms_events`

Use when you need to:

- confirm the server can authenticate
- locate an entity or area
- pull context for a module or parameter
- inspect trends over a bounded time window
- review alarms/events around the same window

## 2. Abnormal Event Investigation

Primary tools:

- `deltav_get_trend_pack`
- `deltav_generate_event_timeline`
- `deltav_correlate_alarms_with_history`
- `deltav_find_first_out`
- `deltav_find_repeating_alarms`
- `deltav_find_chattering_alarms`
- `deltav_summarize_abnormal_event`
- `deltav_compare_before_after_change`

Suggested flow:

1. Pull the key trend pack for the event window.
2. Build an event timeline for the same period.
3. Correlate alarms to nearby history samples.
4. Identify the earliest visible first-out candidate.
5. Check for nuisance patterns such as repeating or chattering alarms.
6. Compare before/after windows if a control change or maintenance action occurred.

Interpretation note:

- timeline and correlation outputs are evidence summaries
- they do not prove causation or assign final root cause

## 3. Batch Analysis

Primary tools:

- `deltav_search_batches`
- `deltav_get_batch_timeline`
- `deltav_compare_batches`
- `deltav_find_batch_deviation_window`
- `deltav_summarize_phase_failures`

Suggested flow:

1. Search batch events for the period of interest.
2. Build the timeline for a target batch or unit.
3. Compare a good batch and a bad batch.
4. Identify the first hold, fail, or abort window.
5. Summarize recurring phase failure patterns.

If a batch phase design needs to be proposed offline, use:

- `generate_phase_logic`

That tool is sandbox-only and produces proposed engineering material, not executable batch code.

## 4. Offline Strategy Generation

Available in `SANDBOX_ENGINEERING`:

- `generate_control_narrative`
- `generate_control_module_design`
- `generate_alarm_list`
- `generate_interlock_matrix`
- `generate_test_protocol`

Use these when you already have a structured strategy input and need proposed artifacts for review.

Recommended sequence:

1. Generate the control narrative.
2. Generate the module design.
3. Generate alarms and interlocks.
4. Generate the FAT/SAT protocol.
5. Review and validate the package before exporting it.

## 5. Review And Validation

Primary review tools:

- `review_control_narrative`
- `review_module_design`
- `review_alarm_list`
- `review_interlock_matrix`
- `review_test_protocol`
- `identify_missing_failure_modes`
- `identify_missing_operator_actions`
- `identify_unsafe_assumptions`
- `validate_control_strategy`

Recommended use:

1. Review narrative completeness.
2. Review naming and mode coverage.
3. Review alarm rationalization and operator actions.
4. Review interlock reset and bypass handling.
5. Validate failure scenarios and test coverage.
6. Run full strategy validation before packaging.

## 6. Package Generation

Primary tool:

- `create_engineering_change_package`

Mode:

- `SANDBOX_ENGINEERING` only

The package writer creates local deliverables under `DELTAV_PACKAGE_OUTPUT_DIR`, including:

- narrative
- module design
- alarm list
- interlock matrix
- FAT/SAT protocol
- MOC summary
- traceability matrix
- validation report
- review checklists

This output is intended for human review and change control. It is not a deployment artifact.

## 7. Diagrams And Reference Patterns

For reusable design context:

- `engineering_list_patterns`
- `engineering_get_pattern`

For Mermaid-only visual artifacts:

- `generate_module_relationship_diagram`
- `generate_cause_effect_diagram`
- `generate_sequence_logic_diagram`
- `generate_mode_state_diagram`
- `generate_batch_phase_diagram`
- `generate_alarm_response_diagram`

These help document or review an approach without expanding the live-control boundary.

## 8. Prompts And Standards Resources

The server also exposes:

- prompt templates for common engineering tasks
- standards and template resources under `deltav://...`

Useful examples:

- `investigate_abnormal_event`
- `generate_pid_loop_design`
- `generate_moc_package`
- `compare_strategy_to_site_standard`

These are guidance assets for the AI client and do not modify DeltaV.
