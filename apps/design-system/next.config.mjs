/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
