import { v4 as uuidv4 } from "uuid";
import type { AppWindow } from "../types/dev-server.js";

declare const window: AppWindow;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const proxyHandler = <T extends (...args: any[]) => any>(
  functionName: [string, string],
  isCallback = false,
) => {
  return (...args: Parameters<T>) => {
    const id = uuidv4();
    const promise = new Promise((resolve: (value: ReturnType<T>) => void) => {
      window.gasStore[id] = {
        resolve: resolve as (value: unknown) => void,
        callback: isCallback ? [...args][0] : undefined,
      };
    });
    window.parent.postMessage(
      {
        type: "request",
        functionName,
        args: isCallback ? [] : [...args],
        id,
      },
      "*",
    );
    return promise;
  };
};
