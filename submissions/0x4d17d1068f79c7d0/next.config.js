/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow API routes in all environments for VRF functionality
  // output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ["localhost"],
  },
  webpack: (config, { isServer }) => {
    // Handle Three.js and other 3D libraries
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });

    // Exclude WebSocket and Flow dependencies from server bundle
    if (isServer) {
      config.externals.push("ws");
      config.externals.push("isomorphic-ws");
      config.externals.push("@onflow/fcl");
      config.externals.push("@onflow/types");
      config.externals.push("@onflow/util-encode-key");
      config.externals.push("@onflow/sdk");
      config.externals.push("@onflow/transport-http");
      config.externals.push("@onflow/fcl-core");
      config.externals.push("canvas");
    }

    return config;
  },
  // External packages for server components
  serverExternalPackages: [
    "@supabase/supabase-js",
    "@onflow/fcl",
    "@onflow/types",
    "@onflow/util-encode-key",
    "@onflow/sdk",
    "@onflow/transport-http",
    "@onflow/fcl-core",
    "ws",
    "isomorphic-ws",
  ],
};

module.exports = nextConfig;
