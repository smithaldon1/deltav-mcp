# Engineering Workflows

## Investigation

Use these tools together for abnormal-event review:

- `deltav_get_trend_pack`
- `deltav_generate_event_timeline`
- `deltav_correlate_alarms_with_history`
- `deltav_find_first_out`
- `deltav_find_repeating_alarms`
- `deltav_find_chattering_alarms`
- `deltav_summarize_abnormal_event`
- `deltav_compare_before_after_change`

These tools provide evidence-driven summaries only. They do not prove causation.

## Batch Analysis

- `deltav_search_batches`
- `deltav_get_batch_timeline`
- `deltav_compare_batches`
- `deltav_find_batch_deviation_window`
- `deltav_summarize_phase_failures`
- `generate_phase_logic`

`generate_phase_logic` is sandbox-only and produces offline proposed logic, not downloadable phase code.

## Engineering Review

- `review_control_narrative`
- `review_module_design`
- `review_alarm_list`
- `review_interlock_matrix`
- `review_test_protocol`
- `identify_missing_failure_modes`
- `identify_missing_operator_actions`
- `identify_unsafe_assumptions`

All review tools return structured findings and explicit open questions.

## Package Generation

`create_engineering_change_package` creates an offline local package with traceability, rollback, training, commissioning, and review artifacts. The package remains a proposed artifact until formally reviewed and approved.
