/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose the Firebase web app config to the browser
  env: {
    NEXT_PUBLIC_FIREBASE_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
