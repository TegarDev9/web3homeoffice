import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@web3homeoffice/shared"],
  experimental: {
    reactCompiler: false
  }
};

export default nextConfig;


