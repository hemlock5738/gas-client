import type { ServerConfig } from "../types/config.js";
import type { AppWindow } from "../types/dev-server.js";
import type { GoogleScriptFunctions } from "../types/functions.js";
import { checkAllowList } from "../utils/check-allow-list.js";
import { proxyHandler } from "../utils/proxy-handler.js";
import { FunctionHost } from "./function-host.js";

declare const window: AppWindow;

export class ServerProxy extends FunctionHost {
  private config: ServerConfig | undefined;

  constructor(config?: ServerConfig) {
    super();
    this.config = config;
    if (typeof window.gasStore === "undefined") {
      window.gasStore = {};
    }
    window.addEventListener("message", this.buildMessageListener(), false);
    this.googleScriptFunctions = this.getGoogleScriptFunctions();
  }

  private buildMessageListener(): (event: MessageEvent) => void {
    return (event: MessageEvent) => {
      const allowOrigin = checkAllowList(
        event.origin,
        this.config?.allowedDevelopmentDomains,
      );
      if (!allowOrigin || event.data.type !== "response") {
        return;
      }

      const { response, id } = event.data;
      const { resolve, callback } = window.gasStore[id];

      if (typeof callback !== "undefined") {
        callback(response);
      }
      resolve();
    };
  }

  private getGoogleScriptFunctions(): GoogleScriptFunctions {
    return {
      history: {
        push: proxyHandler<typeof google.script.history.push>([
          "history",
          "push",
        ]),
        replace: proxyHandler<typeof google.script.history.replace>([
          "history",
          "replace",
        ]),
        setChangeHandler: proxyHandler<
          typeof google.script.history.setChangeHandler
        >(["history", "setChangeHandler"], true),
      },
      url: {
        getLocation: proxyHandler<typeof google.script.url.getLocation>(
          ["url", "getLocation"],
          true,
        ),
      },
    };
  }
}
