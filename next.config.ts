import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/setup-account",
        destination: "/command-center/setup-account",
        permanent: false,
      },
      {
        source: "/admin/login",
        destination: "/command-center/sign-in",
        permanent: false,
      },
      {
        source: "/reset-password",
        destination: "/command-center/reset-password",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
