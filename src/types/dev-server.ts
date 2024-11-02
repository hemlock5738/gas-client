type GasStore = Record<
  string,
  {
    resolve: (value?: unknown) => void;
    callback?: (value?: unknown) => void;
  }
>;

interface GasFunctionData {
  id: string;
  type: "request" | "response";
}

interface DevServerRequest extends GasFunctionData {
  args: unknown[];
  functionName: [string, string];
  type: "request";
}

interface DevServerResponse extends GasFunctionData {
  response: unknown;
  type: "response";
}

interface DevServerContentWindow<Origin extends "GAS" | "App"> extends Window {
  postMessage: {
    (
      message: Origin extends "GAS" ? DevServerResponse : DevServerRequest,
      targetOrigin: string,
      transfer?: Transferable[],
    ): void;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (message: any, options?: WindowPostMessageOptions): void;
  };
}

export interface AppWindow extends Window {
  parent: DevServerContentWindow<"App">;
  gasStore: GasStore;
}

export interface DevServerRequestEvent extends MessageEvent {
  data: DevServerRequest;
}

export interface GasDevServerIframe extends HTMLIFrameElement {
  contentWindow: DevServerContentWindow<"GAS">;
}
