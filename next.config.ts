import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // Bundle WO template PDFs into the API serverless function
    // Required because Vercel serverless doesn't include public/ by default
    '/api/email': ['./public/wo-templates/**'],
  },
};

export default nextConfig;
