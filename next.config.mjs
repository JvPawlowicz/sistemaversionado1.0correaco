
// @ts-check
import { withSentryConfig } from '@sentry/nextjs';

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* Your Next.js config */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Tunnels sentry requests through this app's domain to avoid ad-blockers
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
};

export default withSentryConfig(
  nextConfig,
  sentryConfig,
  sentryWebpackPluginOptions
);
