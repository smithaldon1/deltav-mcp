export function reactorTemperature(nowMs: number): number {
  const cycle = (nowMs / 1000) % 120;
  if (cycle < 30) {
    return 150 + cycle * 0.4;
  }
  if (cycle < 60) {
    return 162 + Math.sin(cycle / 5) * 2;
  }
  if (cycle < 85) {
    return 172 + (cycle - 60) * 0.6;
  }
  return 187 - (cycle - 85) * 0.9;
}
