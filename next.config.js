/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
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
    ];
  },
};

module.exports = nextConfig;
