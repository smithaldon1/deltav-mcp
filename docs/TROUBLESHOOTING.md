# Troubleshooting

## Codex Shows `Tools: (none)`

Common causes:

- the server failed during startup before tool registration completed
- the MCP client is pointing at the wrong `cwd`
- `dist/index.js` is missing or stale
- stdout logging corrupted stdio framing
- the MCP client disabled tools through `enabled_tools` or `disabled_tools`

Checks:

1. Run `npm run build`.
2. Start the server with `node dist/index.js --transport stdio`.
3. Confirm startup errors appear on `stderr`, not `stdout`.
4. Confirm the MCP config `cwd` points at the repository root.

## Auth: Unsupported For Local Stdio

That is normal for local stdio MCP servers. Tool discovery and tool execution do not require a browser-auth handshake.

## stdout Logging Breaking Stdio

In stdio mode, `stdout` must carry only MCP JSON-RPC messages. Any `console.log`, banners, or startup text can break `tools/list`.

This repository now writes startup failures to `stderr` only.

## Wrong `cwd` Or Path

If Codex starts the server from the wrong working directory:

- `.env` may not load correctly
- `dist/index.js` may not resolve
- file-safety path validation may fail

Use the repo root as `cwd`.

## Missing Build Output

If `dist/index.js` does not exist, Codex will start nothing useful even if the config looks correct.

Run:

```bash
npm run build
```

## `enabled_tools` / `disabled_tools` Configuration

If the MCP client is configured to restrict tools, safe tools may not appear even when the server is healthy.

Minimum expected tools:

- `deltav_auth_status`
- `deltav_search_graph`
- `deltav_get_node_context`
- `deltav_get_history`
- `deltav_get_alarms_events`

## Docker Mock UI Blank Screen

If `http://localhost:8080/` goes blank in Docker, check:

1. `docker compose ps`
2. `curl -i http://localhost:8080/api/mock-ui/status`
3. browser console errors

In this repo, a common cause was the mock runtime image missing `src/data`, which caused `/api/mock-ui/status` to 500 and the UI to crash during bootstrap.
