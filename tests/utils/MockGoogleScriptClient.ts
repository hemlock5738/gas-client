const defaultLocation: google.script.UrlLocation = {
  hash: "",
  parameter: {},
  parameters: {},
};

const defaultEvent: google.script.history.HistoryChangeEvent = {
  state: {},
  location: defaultLocation,
};

export class MockGoogleScriptClient {
  history: typeof google.script.history;
  url: typeof google.script.url;
  constructor(
    event: google.script.history.HistoryChangeEvent = defaultEvent,
    location: google.script.UrlLocation = defaultLocation,
  ) {
    this.history = {
      push: (_stateObject, _params, _hash) => undefined,
      replace: (_stateObject, _params) => undefined,
      setChangeHandler: (handler) => {
        handler(event);
      },
    };
    this.url = {
      getLocation: (callback) => {
        callback(location);
      },
    };
  }
}
