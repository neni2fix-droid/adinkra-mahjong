import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Vite 7 + Vitest 3 in a single config file (no separate vitest.config.ts).
 *
 * - `base: './'` keeps the built SPA portable: it can be served from a
 *   sub-path or straight off the filesystem.
 * - The `@/` alias maps onto `src/`. It is expressed as a *regex* so it can
 *   never accidentally rewrite a scoped package specifier such as
 *   `@testing-library/react` (which does not start with `@/`).
 * - Tailwind v4 is wired through the official Vite plugin; there is no
 *   `tailwind.config.js` — tokens live in `@theme` inside
 *   `src/styles/index.css`.
 */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: /^@\//, replacement: '/src/' }],
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
