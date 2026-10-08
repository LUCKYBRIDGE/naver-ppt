import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
const inventory = Object.entries(lock.packages)
  .filter(([path]) => path !== '')
  .map(([path, pkg]) => ({
    path, name: pkg.name ?? path.split('node_modules/').at(-1),
    version: pkg.version, license: pkg.license ?? 'REVIEW_REQUIRED',
    scope: pkg.dev ? 'development' : 'runtime',
  }));
await mkdir(resolve(root, 'docs/generated'), { recursive: true });
await writeFile(resolve(root, 'docs/generated/dependency-licenses.json'), JSON.stringify(inventory, null, 2) + '\n');
console.log(`${inventory.length}개 의존성의 lockfile 라이선스 메타데이터 기록. 실제 배포 조건은 docs/LICENSES.md에서 검토.`);
