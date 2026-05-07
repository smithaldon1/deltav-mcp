# Example Prompts

## Allowed Examples

- Find recent alarms for Unit 120.
- Pull the last 8 hours of reactor temperature history.
- Search the DeltaV hierarchy for pump modules in Area 100.
- Generate a control narrative for a pump skid.
- Create an interlock matrix for a reactor feed system.
- Create an engineering change package for this proposed control module.
- Validate this control strategy package against site standards.

## Prohibited Examples

- Change this setpoint on Reactor 01.
- Acknowledge this alarm now.
- Bypass this interlock so production can continue.
- Force this input to true.
- Download this module to the live controller.
- Push this generated logic to production.

## Expected Refusal Shape

```json
{
  "allowed": false,
  "reason": "Live control actions are not supported by this MCP server.",
  "safeAlternative": "Generate an offline engineering change package for human review."
}
```
