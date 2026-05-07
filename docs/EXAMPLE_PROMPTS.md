# Example Prompts

These examples are written for MCP clients using the server. They show safe usage patterns and examples of requests that should be refused.

## Safe Read-Only Examples

- Check whether the DeltaV MCP server can authenticate to the configured endpoint.
- Search the DeltaV hierarchy for reactor temperature control modules in `AREA_B`.
- Pull the last 8 hours of `TIC-301/PV` history and summarize min, max, and average.
- Find recent alarms for `TIC-301` in the mock reactor temperature control system.
- Build an event timeline for the reactor excursion between `2026-05-06T11:00:00Z` and `2026-05-06T12:00:00Z`.
- Compare alarms and nearby history samples for the same excursion window.
- Find repeating or chattering alarms in `AREA_B` over the last shift.
- Compare batch `BATCH-1001` to batch `BATCH-1002` and identify the likely deviation window.

## Safe Sandbox Engineering Examples

- Generate a control narrative for a pump skid that requires engineering review.
- Generate a proposed DeltaV module design for a reactor temperature loop.
- Create an alarm list for a feed system including operator actions and rationalization.
- Create a conservative interlock matrix for reactor heat input trips.
- Generate a FAT/SAT protocol for the proposed control strategy.
- Validate this proposed control strategy against site-standard checks.
- Review this alarm list for weak operator actions.
- Create an engineering change package named `reactor-temp-control-update`.
- Generate a Mermaid sequence diagram for the reactor heatup sequence.
- Show the `reactor-temperature-control` engineering pattern.

## Prompt Assets Exposed By The Server

The server also registers reusable prompt templates that an MCP client can call directly:

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

Example prompt-oriented requests:

- Use the `investigate_abnormal_event` prompt and focus on a high-temperature excursion in `REACTOR_01`.
- Use the `generate_pid_loop_design` prompt and focus on cascade temperature control with manual fallback.
- Use the `compare_strategy_to_site_standard` prompt and focus on naming-prefix compliance.

## Prohibited Examples

- Change this setpoint on `REACTOR_01` now.
- Acknowledge this alarm immediately.
- Disable this alarm so operations can keep running.
- Bypass this interlock for startup.
- Force this digital input to true.
- Download this module to the live controller.
- Push this generated logic to production.
- Modify live control logic to avoid the trip.
- Write these values directly to DeltaV.

## Expected Refusal Shape

```json
{
  "allowed": false,
  "reason": "Live control actions are not supported by this MCP server.",
  "safeAlternative": "Generate an offline engineering change package for human review."
}
```

## Practical Prompting Notes

- Prefer precise entity IDs, areas, and ISO timestamps.
- Keep read windows bounded so history and alarm queries remain actionable.
- Ask for offline generation, review, or validation rather than implementation into production.
- When using a real DeltaV Edge environment, confirm endpoint assumptions against site documentation first.
