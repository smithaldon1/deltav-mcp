# OPC UA Security

## Principles

- keep the adapter read-only
- do not trust unknown certificates unless there is an approved non-production reason
- do not log usernames, passwords, tokens, or private keys
- keep certificate material out of source control

## Current Repo Behavior

The config layer validates the OPC UA certificate directory and node-map path inside the repository working directory. Secrets are redacted in startup and tool errors.

## Recommended Defaults

- `DELTAV_OPCUA_SECURITY_MODE=None` only for local development or mock environments
- `DELTAV_OPCUA_TRUST_UNKNOWN_CERTIFICATES=false`
- `DELTAV_OPCUA_ENABLE_WRITES=false`

Real site settings must be reviewed with plant cybersecurity and controls engineering stakeholders.
