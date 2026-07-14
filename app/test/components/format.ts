export function formatSpeed(value: number | null) {
  if (value === null) return "—";
  if (value < 1) return "<1";
  return String(Math.round(value));
}

export function formatLatency(value: number | null) {
  return value === null ? "—" : String(Math.round(value));
}
