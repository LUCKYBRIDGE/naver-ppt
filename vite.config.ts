import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { manifest } from './manifest.config.ts';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, 'src'),
  base: './',
  publicDir: resolve(projectRoot, 'public'),
  plugins: [
    react(),
    {
      name: 'extension-manifest',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(manifest, null, 2),
        });
      },
    },
  ],
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rolldownOptions: {
      input: {
        launcher: resolve(projectRoot, 'src/launcher/index.html'),
        player: resolve(projectRoot, 'src/player/index.html'),
        remote: resolve(projectRoot, 'src/remote/index.html'),
        editor: resolve(projectRoot, 'src/editor/index.html'),
        background: resolve(projectRoot, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
