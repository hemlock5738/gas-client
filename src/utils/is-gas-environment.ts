export const isGasEnvironment = (): boolean =>
  typeof google !== "undefined" &&
  Boolean(google?.script?.history) &&
  Boolean(google?.script?.url);
