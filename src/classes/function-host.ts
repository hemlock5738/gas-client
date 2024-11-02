import type { GoogleScriptFunctions } from "../types/functions.js";

export abstract class FunctionHost {
  protected googleScriptFunctions: GoogleScriptFunctions =
    {} as GoogleScriptFunctions;

  get functions(): GoogleScriptFunctions {
    return this.googleScriptFunctions;
  }
}
