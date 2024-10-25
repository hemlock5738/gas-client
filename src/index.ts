import type { FunctionHost } from "./classes/function-host.js";
import { GasPromises } from "./classes/gas-promises.js";
import { ServerProxy } from "./classes/server-proxy.js";
import type { ServerConfig } from "./types/config.js";
import type { GoogleScriptFunctions } from "./types/functions.js";
import { isGasEnvironment } from "./utils/is-gas-environment.js";

export class GasClient {
  private _functionHost: FunctionHost | undefined;

  constructor(config?: ServerConfig) {
    if (isGasEnvironment()) {
      this._functionHost = new GasPromises();
    } else {
      this._functionHost = new ServerProxy(config);
    }
  }

  get googleScriptFunctions(): GoogleScriptFunctions {
    return this._functionHost?.functions as GoogleScriptFunctions;
  }
}

export type { GoogleScriptFunctions };
