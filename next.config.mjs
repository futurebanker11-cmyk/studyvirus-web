/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["gkquestionsguru.com"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)\\.(ico|png|jpg|jpeg|svg|webp|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Old WordPress category pages -> new topic pages
      { source: "/category/indian-history", destination: "/topics/history", permanent: true },
      { source: "/category/indian-polity", destination: "/topics/polity", permanent: true },
      { source: "/category/geography", destination: "/topics/geography", permanent: true },
      { source: "/category/economics", destination: "/topics/economics", permanent: true },
      { source: "/category/physics", destination: "/topics/physics", permanent: true },
      { source: "/category/chemistry", destination: "/topics/chemistry", permanent: true },
      { source: "/category/biology", destination: "/topics/biology", permanent: true },
      { source: "/category/sports", destination: "/topics/sports", permanent: true },
      { source: "/category/computer", destination: "/topics/computer", permanent: true },
      { source: "/category/current-affairs", destination: "/current-affairs", permanent: true },
      // Old WordPress pages
      { source: "/about", destination: "/", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
      { source: "/privacy-policy", destination: "/", permanent: true },
      // Catch-all for old WordPress post format
      { source: "/category/:slug*", destination: "/topics", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
