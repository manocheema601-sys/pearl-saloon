import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures all assets are built with relative paths, making it robust for local and hosted Vercel deployments
});
