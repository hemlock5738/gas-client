import type { AsyncFunction } from "../types/functions.js";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const promisify = <T extends (...args: any[]) => any>(
  fn: T,
): AsyncFunction<T> => {
  return (...args: Parameters<T>) => Promise.resolve(fn(...args));
};
