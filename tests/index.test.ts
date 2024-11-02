import { afterEach, beforeEach, describe, expect, test, vitest } from "vitest";
import { GasClient } from "../src/index.js";
import type { AllowedDevelopmentDomains } from "../src/types/config.js";
import type { AppWindow } from "../src/types/dev-server.js";
import { MockGoogleScriptClient } from "./utils/MockGoogleScriptClient.js";

declare const window: AppWindow;
const uuidRegex = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/;

describe("production gas-client server", () => {
  beforeEach(() => {
    // @ts-ignore
    window.gasStore = undefined;
    vitest.clearAllMocks();
    global.google = {
      script: {
        // @ts-ignore
        history: {},
        // @ts-ignore
        url: {},
      },
    };

    vitest.clearAllMocks();
  });

  test("should contain googleScriptFunctions property", () => {
    const gasClient = new GasClient();
    expect(gasClient).toHaveProperty("googleScriptFunctions");
  });

  test("should be in production mode", () => {
    expect(window.gasStore).toBeUndefined();
    new GasClient();
    expect(window.gasStore).toBeUndefined();
  });

  test("should go to development mode if google is defined but not google.script.history", () => {
    // @ts-ignore
    global.google.script.history = undefined;
    expect(window.gasStore).toBeUndefined();
    new GasClient();
    expect(window).toHaveProperty("gasStore");
  });

  test("should go to development mode if google is defined but not google.script.url", () => {
    // @ts-ignore
    global.google.script.url = undefined;
    expect(window.gasStore).toBeUndefined();
    new GasClient();
    expect(window).toHaveProperty("gasStore");
  });

  test("should go to development mode if google is falsey", () => {
    // @ts-ignore
    global.google = undefined;
    expect(window.gasStore).toBeUndefined();
    new GasClient();
    new GasClient();
    expect(window).toHaveProperty("gasStore");
  });

  test("should promisify google.script.history functions and resolve", async () => {
    // @ts-ignore
    global.google.script = new MockGoogleScriptClient();
    const gasClient = new GasClient();
    const mockHandler = vitest.fn();

    await gasClient.googleScriptFunctions.history.setChangeHandler(mockHandler);

    expect.assertions(1);
    expect(mockHandler).toHaveBeenCalled();
  });

  test("should promisify google.script.history functions and resolve", async () => {
    // @ts-ignore
    global.google.script = new MockGoogleScriptClient();
    const gasClient = new GasClient();
    const mockHandler = vitest.fn();

    await gasClient.googleScriptFunctions.url.getLocation(mockHandler);

    expect.assertions(1);
    expect(mockHandler).toHaveBeenCalled();
  });
});

describe("local development gas-client server", () => {
  type AddEventListenerParams = Parameters<typeof window.addEventListener>;
  const eventHandlersStore: AddEventListenerParams[] = [];
  const originalWindowAddEventListener = window.addEventListener;
  beforeEach(() => {
    // @ts-ignore
    global.google = undefined;
    // @ts-ignore
    window.gasStore = undefined;
    vitest.clearAllMocks();

    window.addEventListener = (...args: AddEventListenerParams) => {
      eventHandlersStore.push({ ...args });
      originalWindowAddEventListener(...args);
    };
  });

  afterEach(() => {
    for (const { 0: type, 1: handler } of eventHandlersStore) {
      window.removeEventListener(type, handler);
    }
    window.addEventListener = originalWindowAddEventListener;
  });

  test("should contain googleScriptFunctions property", () => {
    const gasClient = new GasClient();
    expect(gasClient).toHaveProperty("googleScriptFunctions");
  });

  describe("when set up properly", () => {
    test("should add gasStore to window", () => {
      expect(window.gasStore).toBeUndefined();
      new GasClient();
      expect(window).toHaveProperty("gasStore");
    });

    test("should add window event listener", () => {
      const mockAddEventListener = vitest.fn();
      window.addEventListener = mockAddEventListener;

      new GasClient();
      expect(mockAddEventListener).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
        false,
      );
    });

    test("should post message to window's parent when googleScript function which doesn't include callback parameter is called and store googleScript function info in gasStore", () => {
      const args: Parameters<typeof google.script.history.push> = [{}, {}, ""];
      const mockPostMessage = vitest.fn();
      window.parent.postMessage = mockPostMessage;

      const gasClient = new GasClient();
      gasClient.googleScriptFunctions.history.push(...args);

      expect(Object.entries(window.gasStore).length).toEqual(1);
      expect(Object.entries(window.gasStore)[0][0]).toEqual(
        expect.stringMatching(uuidRegex),
      );
      expect(Object.entries(window.gasStore)[0][1]).toEqual({
        resolve: expect.any(Function),
        callback: undefined,
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          args,
          functionName: ["history", "push"],
          id: expect.stringMatching(uuidRegex),
          type: "request",
        }),
        "*",
      );
    });

    test("should post message to window's parent when googleScript function which includes callback function is called and store googleScript function info in gasStore", () => {
      const args: Parameters<typeof google.script.history.setChangeHandler> = [
        (_: google.script.history.HistoryChangeEvent) => undefined,
      ];
      const mockPostMessage = vitest.fn();
      window.parent.postMessage = mockPostMessage;

      const gasClient = new GasClient();
      gasClient.googleScriptFunctions.history.setChangeHandler(...args);

      expect(Object.entries(window.gasStore).length).toEqual(1);
      expect(Object.entries(window.gasStore)[0][0]).toEqual(
        expect.stringMatching(uuidRegex),
      );
      expect(Object.entries(window.gasStore)[0][1]).toEqual({
        resolve: expect.any(Function),
        callback: args[0],
      });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [],
          functionName: ["history", "setChangeHandler"],
          id: expect.stringMatching(uuidRegex),
          type: "request",
        }),
        "*",
      );
    });

    test("should default to post message to target origin of '*'", () => {
      const args: Parameters<typeof google.script.history.push> = [{}, {}, ""];
      const mockPostMessage = vitest.fn();
      window.parent.postMessage = mockPostMessage;
      const defaultLocation = "*";

      const gasClient = new GasClient();
      gasClient.googleScriptFunctions.history.push(...args);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          args,
          functionName: ["history", "push"],
          id: expect.stringMatching(uuidRegex),
          type: "request",
        }),
        defaultLocation,
      );
    });

    test("should successfully handle received message and resolve successful server function response", () => {
      const gasClient = new GasClient({
        allowedDevelopmentDomains: "https://localhost:3000",
      });

      gasClient.googleScriptFunctions.history.push({}, {}, "");
      const [uuid] = Object.entries(window.gasStore)[0];
      const mockResolve = vitest.fn();

      window.gasStore[uuid].resolve = mockResolve;
      window.gasStore[uuid].callback = undefined;

      const eventBody = {
        data: {
          type: "response",
          response: "",
          id: uuid,
        },
        origin: "https://localhost:3000",
      };
      const messageEvent = new MessageEvent("message", eventBody);
      window.dispatchEvent(messageEvent);

      expect(mockResolve).toHaveBeenCalled();
    });

    test("should successfully handle received message and reject failed server function response", () => {
      const gasClient = new GasClient({
        allowedDevelopmentDomains: "https://localhost:3000",
      });

      gasClient.googleScriptFunctions.history.setChangeHandler(() => undefined);
      const [uuid] = Object.entries(window.gasStore)[0];
      const mockResolve = vitest.fn();
      const mockCallback = vitest.fn();

      window.gasStore[uuid].resolve = mockResolve;
      window.gasStore[uuid].callback = mockCallback;

      const eventBody = {
        data: {
          type: "response",
          response: "googleScript function's response",
          id: uuid,
        },
        origin: "https://localhost:3000",
      };
      const messageEvent = new MessageEvent("message", eventBody);
      window.dispatchEvent(messageEvent);

      expect(mockResolve).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        "googleScript function's response",
      );
    });

    describe("when using allowed development domains config", () => {
      type TestSuccessfulServerCall = (
        {
          allowedDevelopmentDomains,
          origin,
          responseType,
        }: {
          allowedDevelopmentDomains: AllowedDevelopmentDomains;
          origin: string;
          responseType?: string;
        },
        { shouldPass }: { shouldPass: boolean },
      ) => void;
      const testSuccessfulServerCall: TestSuccessfulServerCall = (
        { allowedDevelopmentDomains, origin, responseType = "response" },
        { shouldPass },
      ) => {
        const gasClient = new GasClient({
          allowedDevelopmentDomains,
        });

        gasClient.googleScriptFunctions.history.push({}, {}, "");
        const [uuid] = Object.entries(window.gasStore)[0];
        const mockResolve = vitest.fn();

        window.gasStore[uuid].resolve = mockResolve;

        const eventBody = {
          data: {
            type: responseType,
            response: "",
            id: uuid,
          },
          origin,
        };
        const messageEvent = new MessageEvent("message", eventBody);
        window.dispatchEvent(messageEvent);

        if (shouldPass) {
          expect(mockResolve).toHaveBeenCalled();
        } else {
          expect(mockResolve).not.toHaveBeenCalled();
        }
      };

      test("should resolve successfully when allowed development domains equals origin", () => {
        const allowedDevelopmentDomains = "https://localhost:3000";
        const origin = "https://localhost:3000";
        const shouldPass = true;

        testSuccessfulServerCall(
          {
            allowedDevelopmentDomains,
            origin,
          },
          { shouldPass },
        );
      });

      test("should not resolve successfully when allowed development domains doesn't equal origin", () => {
        const allowedDevelopmentDomains = "https://localhost:8080";
        const origin = "https://localhost:3000";
        const shouldPass = false;

        testSuccessfulServerCall(
          {
            allowedDevelopmentDomains,
            origin,
          },
          { shouldPass },
        );
      });

      test("should resolve successfully when allowed development domains string contains origin", () => {
        const allowedDevelopmentDomains =
          "https://localhost:8080 https://localhost:3000";
        const origin = "https://localhost:3000";
        const shouldPass = true;

        testSuccessfulServerCall(
          {
            allowedDevelopmentDomains,
            origin,
          },
          { shouldPass },
        );
      });

      test("should resolve successfully when allowed development domains function returns true for origin", () => {
        const allowedDevelopmentDomains = (origin: string) =>
          /localhost:\d+$/.test(origin);
        const origin = "https://localhost:3000";
        const shouldPass = true;

        testSuccessfulServerCall(
          {
            allowedDevelopmentDomains,
            origin,
          },
          { shouldPass },
        );
      });

      test("should not resolve successfully when allowed development domains function does not return true", () => {
        const allowedDevelopmentDomains = () => false;
        const origin = "https://localhost:3000";
        const shouldPass = false;

        testSuccessfulServerCall(
          {
            allowedDevelopmentDomains,
            origin,
          },
          { shouldPass },
        );
      });

      test("should not resolve successfully when response type is not 'RESPONSE'", () => {
        const allowedDevelopmentDomains = "https://localhost:3000";
        const origin = "https://localhost:3000";
        const responseType = "not response";
        const shouldPass = false;

        testSuccessfulServerCall(
          {
            allowedDevelopmentDomains,
            origin,
            responseType,
          },
          { shouldPass },
        );
      });
    });
  });
});
