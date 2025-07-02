import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (SENTRY_DSN) {
        Sentry.init({
            dsn: SENTRY_DSN,
            tracesSampleRate: 1.0,
        });
    }
  }
}
