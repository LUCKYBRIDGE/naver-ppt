import { readFile, readdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

export function pdfResources(root: string): Plugin {
  const packageRoot = resolve(root, 'node_modules/pdfjs-dist');
  const folders = ['cmaps', 'standard_fonts', 'wasm', 'iccs'];
  return {
    name: 'local-pdf-resources',
    async generateBundle() {
      for (const folder of folders) {
        for (const file of await readdir(resolve(packageRoot, folder))) {
          if (file.startsWith('quickjs-eval')) continue;
          this.emitFile({ type: 'asset', fileName: `pdf-resources/${folder}/${file}`, source: await readFile(resolve(packageRoot, folder, file)) });
        }
      }
      this.emitFile({ type: 'asset', fileName: 'pdf-resources/LICENSE', source: await readFile(resolve(packageRoot, 'LICENSE')) });
      this.emitFile({ type: 'asset', fileName: 'licenses/lucide-react-LICENSE', source: await readFile(resolve(root, 'node_modules/lucide-react/LICENSE')) });
      this.emitFile({ type: 'asset', fileName: 'licenses/web-ppt-core-LICENSE', source: await readFile(resolve(root, 'node_modules/@web-ppt/core/LICENSE')) });
      this.emitFile({ type: 'asset', fileName: 'licenses/web-ppt-viewer-core-LICENSE', source: await readFile(resolve(root, 'node_modules/@web-ppt/viewer-core/LICENSE')) });
      for (const [name, file] of [['pdf-lib', 'LICENSE.md'], ['@pdf-lib/standard-fonts', 'LICENSE.md'], ['@pdf-lib/upng', 'LICENSE'], ['pako', 'LICENSE'], ['tslib', 'CopyrightNotice.txt'], ['fflate', 'LICENSE']]) {
        this.emitFile({ type: 'asset', fileName: `licenses/${name!.replaceAll('/', '-')}-LICENSE`, source: await readFile(resolve(root, 'node_modules', name!, file!)) });
      }
    },
    configureServer(server) {
      server.middlewares.use('/pdf-resources', async (request, response, next) => {
        const path = decodeURIComponent((request.url ?? '').split('?')[0]!);
        const parts = path.split('/').filter(Boolean);
        if (parts.length !== 2 || !folders.includes(parts[0]!) || parts[1]!.startsWith('quickjs-eval')) { next(); return; }
        const target = resolve(packageRoot, parts[0]!, parts[1]!);
        if (!target.startsWith(packageRoot + sep)) { next(); return; }
        try {
          const data = await readFile(target);
          response.setHeader('Content-Type', target.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
          response.end(data);
        } catch { next(); }
      });
    },
  };
}
