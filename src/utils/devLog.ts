const isDev = process.env.NODE_ENV === 'development';

/** Console logging — development only. No-op in production. */
export function devLog(...args: unknown[]): void {
  if (!isDev) return;
  console.log(...args);
}

/** Console warnings — development only. No-op in production. */
export function devWarn(...args: unknown[]): void {
  if (!isDev) return;
  console.warn(...args);
}

/** Grouped console output — development only. */
export function devGroup(label: string, fn: () => void): void {
  if (!isDev) return;
  console.group(label);
  try {
    fn();
  } finally {
    console.groupEnd();
  }
}
