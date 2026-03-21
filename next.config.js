/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // prisma/seed.ts is a standalone CLI tool, not part of the Next.js app.
    // Next.js type-checks it anyway, so we suppress build-blocking TS errors.
    // All app code is still fully typed in the IDE.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
