/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disallow building with TypeScript errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Disallow building with ESLint errors
    ignoreDuringBuilds: false,
  }
};

export default nextConfig;
