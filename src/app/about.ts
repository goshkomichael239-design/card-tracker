/** What the "About" screen says about the project. */

export const APP_NAME = 'Card Tracker';

/** Set by the build from package.json. */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.1.0';

export const REPO_URL = 'https://github.com/goshkomichael239-design/card-tracker';

/**
 * Where a donation can be sent (the TON network). While it is empty the
 * "support" block of the About screen does not show an address.
 */
export const TON_ADDRESS =
  'UQCubsh1Af5AKdZnENzZVszC37M7vXb_Eo0Pqy1EI1hT3evi';
