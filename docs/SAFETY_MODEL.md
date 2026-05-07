# Safety Model

## Supported Modes

- `READ_ONLY`
- `SANDBOX_ENGINEERING`

`READ_ONLY` is the default.

## READ_ONLY

Allowed:

- DeltaV Edge authentication
- graph browsing
- historical value reads
- alarm/event reads
- batch-event reads where configured
- local/offline validation and review
- read-only investigation tools
- pattern, prompt, and standards-resource access

Not allowed:

- engineering package creation
- offline artifact generation that creates new engineering deliverables
- any live-write-like behavior

## SANDBOX_ENGINEERING

Allowed in addition to `READ_ONLY`:

- offline control narratives
- offline control module designs
- offline alarm lists
- offline interlock matrices
- offline test protocols
- offline phase logic proposals
- Mermaid engineering diagrams
- local engineering package creation

Not allowed:

- any production writes
- live controller modification
- alarm acknowledgement
- setpoint changes
- I/O forcing
- interlock bypass execution
- module downloads

## Refusal Model

Natural-language requests implying prohibited control actions are blocked and should return a structured refusal with a safe alternative:

- generate an offline engineering package
- generate a proposed control strategy
- perform a read-only investigation

## Human Review Requirement

All generated artifacts are proposed only.

They require:

- qualified engineering review
- site MOC/change-control process
- formal approval before any production implementation
