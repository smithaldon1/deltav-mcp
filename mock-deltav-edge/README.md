# mock-deltav-edge

Development-only simulated DeltaV Edge-style REST API for local testing, demos, CI, and MCP integration work.

This is not a certified DeltaV Edge emulator. Endpoint paths and payload shapes are intentionally mock-friendly and must not be treated as confirmed production contracts.

## Run

```bash
npm run dev -w mock-deltav-edge
```

Default health endpoint:

```text
http://localhost:8080/health
```

Default web UI:

```text
http://localhost:8080/
```

Default API base:

```text
http://localhost:8080/edge/api/v1
```

## Features

- fake bearer-token authentication
- graph browsing by id and path
- deterministic history generation
- alarms and events filtering
- batch event filtering
- error and delay simulation headers
- browser UI with hierarchy, trends, alarms, batch views, scenarios, and Mermaid previews

## Development Only

- no live control support
- no real credentials
- no claim of DeltaV certification
