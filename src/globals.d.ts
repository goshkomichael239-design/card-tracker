/** The version of the app, put in by the build (vite.config.ts) from package.json. */
declare const __APP_VERSION__: string;

/** Which web build this is: the main one or the experimental one in next/ (vite.config.ts). */
declare const __CHANNEL__: 'stable' | 'next';
