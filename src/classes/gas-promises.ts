import { promisify } from "../utils/promisify.js";
import { FunctionHost } from "./function-host.js";

export class GasPromises extends FunctionHost {
  constructor() {
    super();
    this.promisifyGoogleScriptFunctions();
  }

  private promisifyGoogleScriptFunctions(): void {
    this.googleScriptFunctions = {
      history: {
        push: promisify(google.script.history.push),
        replace: promisify(google.script.history.replace),
        setChangeHandler: promisify(google.script.history.setChangeHandler),
      },
      url: {
        getLocation: promisify(google.script.url.getLocation),
      },
    };
  }
}
