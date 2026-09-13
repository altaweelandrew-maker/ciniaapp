/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production" || process.env.GITHUB_ACTIONS === "true";
const repoName = "ciniaapp";

const nextConfig = {
  output: "export",
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "assets.vercel.com",
      },
    ],
  },
};

export default nextConfig;
