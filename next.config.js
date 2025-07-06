/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  async redirects() {
    return [
      {
        source: '/financial',
        destination: '/analysis',
        permanent: true,
      },
      {
        source: '/financial/:path*',
        destination: '/analysis',
        permanent: true,
      },
      {
        source: '/reports',
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
