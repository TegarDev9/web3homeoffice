import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/app",
  transpilePackages: ["@web3homeoffice/shared"],
  experimental: {
    reactCompiler: false
  }
};

export default nextConfig;


