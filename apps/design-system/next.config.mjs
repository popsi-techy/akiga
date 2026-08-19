/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Local verification builds go somewhere else.
   *
   * `next build` writes `.next`, which is the same directory `next dev` is serving
   * from — so building while the preview is up wipes it out, the running app loses
   * its CSS or starts throwing, and the next screenshot shows a regression that is
   * not real. Setting `NEXT_DIST_DIR` moves the build's output aside so the two can
   * coexist. Unset — which is how CI and Vercel run — it stays `.next`.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Allow importing the shared registries JSON from outside the app directory
  // (registries/product/*.json), so they are the runtime source of truth.
  experimental: { externalDir: true },
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },
};

export default nextConfig;
