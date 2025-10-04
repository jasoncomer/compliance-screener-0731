/**
 * Throttle utility for performance optimization
 * Ensures a function is called at most once per specified time interval
 */

/**
 * Creates a throttled function that only invokes `func` at most once per `wait` milliseconds.
 * The throttled function will invoke `func` with the most recent arguments provided to it.
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @returns A new, throttled function
 *
 * @example
 * const throttledMouseMove = throttle((e: MouseEvent) => {
 *   console.log('Mouse moved', e.clientX, e.clientY);
 * }, 16); // ~60fps
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;

  const invokeFunc = () => {
    if (lastArgs) {
      func(...lastArgs);
      lastCallTime = Date.now();
      lastArgs = null;
    }
  };

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (lastCallTime === null) {
      // First call
      invokeFunc();
      return;
    }

    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= wait) {
      // Enough time has passed, invoke immediately
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      invokeFunc();
    } else if (!timeoutId) {
      // Schedule invocation for remaining time
      const remainingTime = wait - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        invokeFunc();
      }, remainingTime);
    }
  };

  return throttled;
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A new, debounced function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
