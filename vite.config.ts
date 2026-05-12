/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const DEFAULT_SELISE_PROJECT_KEY = 'P8d53101e85884a6fbb63551ddc61c63f';

// https://vitejs.dev/config/
// Note: CJS deprecation warning is informational and doesn't affect functionality.
// It occurs when dependencies use the legacy CommonJS Vite API instead of ES modules.
// This is expected during the migration period from CRA to Vite.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredBlocksApiUrl =
    env.VITE_BLOCKS_UPSTREAM_API_URL ||
    env.BLOCKS_UPSTREAM_API_URL ||
    env.VITE_BLOCKS_API_URL ||
    env.VITE_API_BASE_URL ||
    'https://api.seliseblocks.com';
  const blocksApiUrl = configuredBlocksApiUrl.startsWith('/')
    ? 'https://api.seliseblocks.com'
    : configuredBlocksApiUrl;
  const projectKey =
    env.VITE_X_BLOCKS_KEY ||
    env.X_BLOCKS_KEY ||
    env.SELISE_X_BLOCKS_KEY ||
    DEFAULT_SELISE_PROJECT_KEY;

  return {
    plugins: [react()],

    define: projectKey
      ? {
          'import.meta.env.VITE_X_BLOCKS_KEY': JSON.stringify(projectKey),
        }
      : {},

    // Path aliases to match tsconfig paths
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      host: true,
      open: false,
      allowedHosts: true, // ✅ works for all tenants/domains
      proxy: {
        '/blocks-api': {
          target: blocksApiUrl,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: '',
          rewrite: (requestPath) => requestPath.replace(/^\/blocks-api/, ''),
        },
      },
    },

    // Build configuration
    build: {
      outDir: 'build', // Keep same output directory as CRA
      sourcemap: true,
      chunkSizeWarningLimit: 700, // Increase limit since gzipped sizes are acceptable
      // Optimize chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            query: ['@tanstack/react-query'],
            ui: [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
            ],
          },
        },
      },
    },

    // Environment variables configuration
    // Vite automatically loads .env files and exposes variables prefixed with VITE_
    envPrefix: 'VITE_',

    // CSS configuration
    css: {
      postcss: './postcss.config.js', // Use existing PostCSS config
    },

    // Vitest test configuration
    test: {
      globals: true, // so you can use 'describe', 'it', 'expect' without importing
      environment: 'jsdom', // simulates browser for React components
      setupFiles: ['./vitest.polyfills.ts', './vitest.setup.ts'], // polyfills must load first
      coverage: {
        provider: 'v8',
        reporter: ['lcov', 'text', 'html'],
        reportsDirectory: 'coverage',
        include: ['src/**/*.{ts,tsx}'], // include all source files
        exclude: [
          'src/**/*.spec.{ts,tsx}',
          'src/**/*.test.{ts,tsx}',
          'src/**/*.model.ts',
          'src/**/*.module.ts',
          'src/**/*.d.ts',
          'src/assets/**',
          'node_modules/**',
        ],
      },
      include: ['**/*.spec.{ts,tsx}'],
      // Mock file imports (images, CSS, etc.)
      // server.deps.inline removed (not needed unless you have ESM/CJS issues)
    },

    // optimizeDeps.include removed (not needed unless you have pre-bundling issues)
  };
});
