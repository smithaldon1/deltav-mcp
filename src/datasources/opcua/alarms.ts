import { ValidationError } from "../../utils/errors.js";

export function assertOpcUaAlarmsUnsupported(): never {
  throw new ValidationError(
    "OPC UA alarms/events are not implemented in this repository. Use EDGE_REST or MOCK_EDGE_REST for alarms and events.",
  );
}
