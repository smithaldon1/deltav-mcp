# Architecture

```text
AI Client -> MCP Server -> DeltaV Edge REST API -> DeltaV Edge Environment -> DeltaV system replica/context
```

## Safety Boundary

The MCP server is a constrained read-oriented and offline-engineering boundary. It can:

- authenticate through DeltaV Edge
- browse hierarchy/context
- read history
- read alarms/events
- read batch events where configured
- generate offline engineering artifacts
- validate and review offline artifacts

It does not communicate directly with live controllers.

## Additional Context Sources

The server also exposes approved internal references through:

- prompts for engineering workflows
- resources for site standards and templates
- engineering pattern library
- local generated packages

## Mock API

For development and testing, the repository includes `mock-deltav-edge`, a simulated REST service that mirrors the read-only integration style used by the MCP server. It is not a certified DeltaV Edge emulator.
