/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Turbopack from treating ~/ as the workspace root because of a
  // stray pnpm-lock.yaml outside this project (makes first compile crawl forever).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
