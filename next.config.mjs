/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

// Injected by Sentry CLI - this is a temporary workaround for Vercel builds
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withSentryConfig } = require("@sentry/nextjs");

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
    
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  }
);
