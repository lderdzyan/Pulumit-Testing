/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: [],
  basePath: process.env.NEXT_PUBLIC_PATH,
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  distDir: process.env.NODE_ENV === "production" ? "build" : undefined,
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
};
