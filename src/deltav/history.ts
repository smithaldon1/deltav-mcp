export function buildHistoryQuery(
  start: string,
  end: string,
  maxPoints: number,
  useMock = false,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set(useMock ? "StartTime" : "start", start);
  params.set(useMock ? "EndTime" : "end", end);
  params.set(useMock ? "PS" : "maxPoints", String(maxPoints));
  return params;
}
