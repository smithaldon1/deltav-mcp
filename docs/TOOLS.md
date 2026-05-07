# Tools

## Core DeltaV Read Tools

- `deltav_auth_status`: authenticate and report sanitized auth status.
- `deltav_search_graph`: browse/search the graph with access control and limits.
- `deltav_get_node_context`: get entity metadata/context.
- `deltav_get_history`: read historical values with summary statistics.
- `deltav_get_alarms_events`: read alarms/events with filtering and pagination.
- `deltav_search_batches`: read batch events with filtering and pagination.

## Investigation Tools

- `deltav_get_trend_pack`
- `deltav_generate_event_timeline`
- `deltav_correlate_alarms_with_history`
- `deltav_find_first_out`
- `deltav_find_repeating_alarms`
- `deltav_find_chattering_alarms`
- `deltav_summarize_abnormal_event`
- `deltav_compare_before_after_change`

These are read-only analytical helpers. They do not write to DeltaV.

## Pattern Tools

- `engineering_list_patterns`
- `engineering_get_pattern`

## Batch Tools

- `deltav_get_batch_timeline`
- `deltav_compare_batches`
- `deltav_find_batch_deviation_window`
- `deltav_summarize_phase_failures`
- `generate_phase_logic`

`generate_phase_logic` is sandbox-only and produces offline proposed logic.

## Engineering Generation Tools

- `generate_control_narrative`
- `generate_control_module_design`
- `generate_alarm_list`
- `generate_interlock_matrix`
- `generate_test_protocol`
- `create_engineering_change_package`

These generate proposed artifacts only and require qualified review.

## Review Tools

- `review_control_narrative`
- `review_module_design`
- `review_alarm_list`
- `review_interlock_matrix`
- `review_test_protocol`
- `identify_missing_failure_modes`
- `identify_missing_operator_actions`
- `identify_unsafe_assumptions`
- `validate_control_strategy`

Review outputs are structured:

```json
{
  "passed": true,
  "findings": [],
  "openQuestions": []
}
```

## Diagram Tools

- `generate_module_relationship_diagram`
- `generate_cause_effect_diagram`
- `generate_sequence_logic_diagram`
- `generate_mode_state_diagram`
- `generate_batch_phase_diagram`
- `generate_alarm_response_diagram`

All diagram tools output Mermaid text only.
