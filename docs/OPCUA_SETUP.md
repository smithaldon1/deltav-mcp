# OPC UA Setup

## Environment Variables

Relevant settings:

- `DELTAV_DATA_SOURCE=OPCUA`
- `DELTAV_OPCUA_ENDPOINT_URL`
- `DELTAV_OPCUA_SECURITY_MODE`
- `DELTAV_OPCUA_SECURITY_POLICY`
- `DELTAV_OPCUA_USERNAME`
- `DELTAV_OPCUA_PASSWORD`
- `DELTAV_OPCUA_APPLICATION_NAME`
- `DELTAV_OPCUA_CERT_DIR`
- `DELTAV_OPCUA_TRUST_UNKNOWN_CERTIFICATES`
- `DELTAV_OPCUA_SESSION_TIMEOUT_MS`
- `DELTAV_OPCUA_REQUEST_TIMEOUT_MS`
- `DELTAV_OPCUA_MAX_NODES_PER_READ`
- `DELTAV_OPCUA_ENABLE_SUBSCRIPTIONS`
- `DELTAV_OPCUA_ENABLE_WRITES`
- `DELTAV_OPCUA_NODE_MAP_PATH`

## NodeId Mapping

Use [config/opcua-node-map.example.json](/Users/aldonsmith/Documents/Programming/deltav-mcp/config/opcua-node-map.example.json) as the starting point.

For local mock development, the repo also includes [config/opcua-node-map.json](/Users/aldonsmith/Documents/Programming/deltav-mcp/config/opcua-node-map.json), which matches the checked-in `mock-opcua-server/` address space.

NodeIds are site-specific. Do not assume all DeltaV OPC UA deployments expose identical browse paths or NodeIds.

## Site Assumptions

The current repo provides a working read-only client path, but a full site integration still requires:

- verified endpoint URL
- validated security mode and policy
- certificate trust model review
- site-specific NodeId mapping
- read-only access confirmation
