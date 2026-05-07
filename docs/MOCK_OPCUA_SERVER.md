# Mock OPC UA Server

## Current State

This repository now includes `mock-opcua-server/`, a local `node-opcua`-based development server with deterministic demo values and browseable folder structure.

## Intended Endpoint

The default endpoint is:

```text
opc.tcp://localhost:4840/UA/DeltaVMock
```

## Included Demo Systems

- pump skid
- reactor temperature control
- CIP skid
- tank level control
- utility header

## Supported Local Use Cases

- endpoint discovery
- anonymous or username/password local auth
- namespace inspection
- browse
- single-node reads
- multi-node reads
- monitored-item capture windows

## Limitations

- not a certified DeltaV emulator
- no writes or mutating methods
- no claim of site-specific NodeId parity
- no historian-backed history
- no production suitability

## Safety Expectation

The mock server is for development, tests, and demos only. It must not be treated as evidence of production-site OPC UA parity.
