import type { AlarmDefinition } from "./schemas.js";

export function generateAlarmListArtifact(alarms: readonly AlarmDefinition[]): readonly AlarmDefinition[] {
  return alarms;
}

export function renderAlarmListCsv(alarms: readonly AlarmDefinition[]): string {
  const header =
    "alarm_name,condition,priority,operator_action,consequence,rationalization";
  const lines = alarms.map((alarm) =>
    [
      alarm.name,
      alarm.condition,
      alarm.priority,
      alarm.operatorAction,
      alarm.consequence,
      alarm.rationalization,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [header, ...lines].join("\n");
}

function csvEscape(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}
