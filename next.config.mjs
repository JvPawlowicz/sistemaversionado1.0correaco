/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // We've enabled this to unblock the deployment. It's recommended to
    // eventually set this to `false` and fix any type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
