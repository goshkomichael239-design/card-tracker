/** What the "About" screen says about the project. */

export const APP_NAME = 'Card Tracker';

/** Set by the build from package.json. */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.1.0';

export const REPO_URL = 'https://github.com/goshkomichael239-design/card-tracker';

/** Where a donation can be sent: one address per coin, all in the TON network. */
export const DONATION_ADDRESSES: { coin: string; address: string }[] = [
  { coin: 'GRAM', address: 'UQCd2PUDEvWKAbVLrcaE1VDU69wuxGy2WdM_f5jOZ0EhdjJK' },
  { coin: 'USDT', address: 'UQCubsh1Af5AKdZnENzZVszC37M7vXb_Eo0Pqy1EI1hT3evi' },
];
