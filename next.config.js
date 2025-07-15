

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/financial/:path*',
        destination: '/analysis',
        permanent: true,
      },
      {
        source: '/reports/:path*',
        destination: '/analysis',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;

