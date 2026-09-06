import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/stop-de-mrsa",
  assetPrefix: "/stop-de-mrsa/",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
