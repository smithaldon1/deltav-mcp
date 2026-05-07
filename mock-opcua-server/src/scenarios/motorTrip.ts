export function motorTripSignal(nowMs: number): { readonly running: boolean; readonly fault: boolean } {
  const seconds = Math.floor(nowMs / 1000) % 40;
  return {
    running: seconds < 28,
    fault: seconds >= 28 && seconds < 34,
  };
}
