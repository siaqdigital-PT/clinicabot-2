/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/demo",
        destination: "/#demo",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;