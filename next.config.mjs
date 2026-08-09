/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so Turbopack ignores stray lockfiles above the project.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
