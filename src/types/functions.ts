// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type AsyncFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

type HistoryFunctions = {
  [K in keyof typeof google.script.history]: AsyncFunction<
    (typeof google.script.history)[K]
  >;
};

type UrlFunctions = {
  [K in keyof typeof google.script.url]: AsyncFunction<
    (typeof google.script.url)[K]
  >;
};

export type GoogleScriptFunctions = {
  history: HistoryFunctions;
  url: UrlFunctions;
};
