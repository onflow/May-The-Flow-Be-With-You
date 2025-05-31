/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow API routes in all environments for VRF functionality
  // output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ["localhost"],
  },
  webpack: (config) => {
    // Handle Three.js and other 3D libraries
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
  // External packages for server components
  serverExternalPackages: ["@supabase/supabase-js"],
};

module.exports = nextConfig;
