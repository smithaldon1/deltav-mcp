export function chatteringAlarm(nowMs: number): boolean {
  return Math.floor(nowMs / 5000) % 2 === 0;
}
