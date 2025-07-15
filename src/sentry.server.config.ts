// This file configures the Sentry Node.js server SDK.
// It is used to capture errors and performance metrics from the server.

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for finer control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // You can uncomment the line below to disable all Sentry logs here
    // enabled: process.env.NODE_ENV === 'production',
  });
}
