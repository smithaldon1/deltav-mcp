# Pattern Library

The engineering pattern library exposes reusable structured reference patterns for common control and equipment scenarios.

## Access Tools

- `engineering_list_patterns`
- `engineering_get_pattern`

## Available Pattern Coverage

The current library includes patterns such as:

- PID loop
- cascade loop
- ratio control
- motor
- valve
- analog input
- analog output
- discrete input
- discrete output
- pump skid
- reactor temperature control
- CIP sequence
- batch phase
- equipment module
- unit module
- permissive and interlock logic

## What A Pattern Contains

Pattern responses are structured engineering references that can include:

- purpose
- I/O expectations
- parameters
- alarms
- interlocks
- operating modes
- failure modes
- operator actions
- test cases
- common mistakes
- implementation notes
- open engineering questions

## Example Usage

List patterns:

```json
{}
```

Get a specific pattern:

```json
{
  "patternName": "reactor-temperature-control"
}
```

## Intended Use

Use patterns to:

- bootstrap structured offline design inputs
- compare a proposal against a known reference shape
- seed control narratives, interlock matrices, and test protocols
- standardize recurring equipment and module concepts

## Safety Notes

- patterns are references, not deployable controller content
- they do not replace site standards, hazard review, or MOC
- use them as structured starting points for qualified engineering review
