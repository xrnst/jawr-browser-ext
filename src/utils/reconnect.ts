const RECONNECT_INITIAL_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

type RetryFn = () => Promise<void>;

export function createReconnector(retry: RetryFn) {
  let delay = RECONNECT_INITIAL_MS;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  function schedule(): void {
    if (timer !== null || cancelled) return;
    timer = setTimeout(() => {
      timer = null;
      if (cancelled) return;
      retry()
        .then(() => {
          delay = RECONNECT_INITIAL_MS;
        })
        .catch(() => {
          delay = Math.min(delay * 2, RECONNECT_MAX_MS);
          schedule();
        });
    }, delay);
  }

  function clear(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    delay = RECONNECT_INITIAL_MS;
  }

  function cancel(): void {
    cancelled = true;
    clear();
  }

  function arm(): void {
    cancelled = false;
    clear();
  }

  return { schedule, clear, cancel, arm };
}
