# gas-client

A Google Apps Script client-side API wrapper that includes development mode.

This is inspired by [gas-client](https://github.com/enuchi/gas-client).

## Installation

1. Authenticate to GitHub Packages and specify the GitHub Packages URL along with the namespace:

   .npmrc

   ```
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   @hemlock5738:registry=https://npm.pkg.github.com
   ```

2. Install package:

   ```sh
   npm install @hemlock5738/gas-client
   ```

## Usage

```js
import { GasClient } from "gas-client";
const { googleScriptFunctions } = new GasClient();

googleScriptFunctions.history.push(
  { timestamp: new Date().getTime() },
  { options: "node" },
  "anchor1",
);

googleScriptFunctions.url.getLocation((location) => {
  console.log(location.parameters);
  console.log(location.hash);
});
```

## License

This is licensed under the [MIT License](LICENSE).

This also contains code derived or copied from [gas-client(MIT)](https://github.com/enuchi/gas-client)
