# Diagrams

The server can generate Mermaid text for offline engineering review. Diagram generation is available only in `SANDBOX_ENGINEERING`.

## Available Tools

- `generate_module_relationship_diagram`
- `generate_cause_effect_diagram`
- `generate_sequence_logic_diagram`
- `generate_mode_state_diagram`
- `generate_batch_phase_diagram`
- `generate_alarm_response_diagram`

## Input Shapes

Relationship and cause/effect diagrams use:

```json
{
  "title": "Reactor Loop",
  "entities": ["REACTOR_01", "TIC-301", "TV-301"]
}
```

Sequence, mode/state, batch-phase, and alarm-response diagrams use:

```json
{
  "title": "Heatup Sequence",
  "steps": ["Verify permissives", "Enable heat", "Monitor ramp", "Hold at target"]
}
```

## Output Shape

Each diagram tool returns:

- `mermaid`
- `openQuestions`

Example:

```json
{
  "mermaid": "flowchart TD\n  A[Verify permissives] --> B[Enable heat]",
  "openQuestions": []
}
```

## Intended Uses

- review module relationships
- document cause/effect chains
- capture sequence logic
- describe operating-mode transitions
- show batch-phase flow
- outline alarm-response steps

## Safety Notes

- Mermaid text only; no rendering service is invoked by the MCP server
- output is proposed documentation, not executable control logic
- diagrams still require engineering review before they inform implementation

## Previewing Mermaid

The mock UI includes a Mermaid preview surface at `http://localhost:8080/` when the mock app is running. That is useful for reviewing diagram output during development.
