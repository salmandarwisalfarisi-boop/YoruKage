interface State {
  failures: number;
  openedUntil: number;
}

const states = new Map<string, State>();
const FAILURE_LIMIT = 5;
const OPEN_MS = 120_000;

export function circuitAllows(key: string): boolean {
  const state = states.get(key);
  return !state || Date.now() >= state.openedUntil;
}

export function circuitSuccess(key: string): void {
  states.delete(key);
}

export function circuitFailure(key: string): void {
  const state = states.get(key) || { failures: 0, openedUntil: 0 };
  state.failures += 1;
  if (state.failures >= FAILURE_LIMIT) state.openedUntil = Date.now() + OPEN_MS;
  states.set(key, state);
}
