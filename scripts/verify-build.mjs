import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.background.type, 'module');
assert.equal(manifest.action.default_popup, 'launcher/index.html');
assert.deepEqual(manifest.permissions, ['downloads'], '로컬 파일 저장에 필요한 downloads만 허용합니다.');
assert.equal((manifest.host_permissions ?? []).length, 0);
assert.equal((manifest.externally_connectable ?? {}).matches, undefined);
assert.equal(manifest.content_security_policy.extension_pages, "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'self'");
for (const path of ['LICENSE', 'standard_fonts/LICENSE_FOXIT', 'standard_fonts/LICENSE_LIBERATION', 'cmaps/Adobe-Korea1-UCS2.bcmap']) {
  await access(resolve(root, 'pdf-resources', path));
}
await access(resolve(root, manifest.background.service_worker));
await access(resolve(root, 'licenses/lucide-react-LICENSE'));
await access(resolve(root, 'licenses/fflate-LICENSE'));
await access(resolve(root, 'licenses/web-ppt-core-LICENSE'));
await access(resolve(root, 'licenses/web-ppt-core-MODIFICATIONS.txt'));
await access(resolve(root, 'licenses/web-ppt-viewer-core-LICENSE'));
assert.ok((await readdir(resolve(root, 'assets'))).some(name => /^modelWorker-[\w-]+\.js$/.test(name)), 'PPTX 모델 검사의 로컬 Worker 누락');
const workerFiles = (await readdir(resolve(root, 'assets'))).filter(name => /^(?:modelWorker|worker)-[\w-]+\.js$/.test(name));
const workerCode = (await Promise.all(workerFiles.map(name => readFile(resolve(root, 'assets', name), 'utf8')))).join('\n');
assert.ok(/presentation:/.test(workerCode) && /assets:/.test(workerCode), '고정 PPTX 파서 Worker 초기화 누락');
assert.ok(workerCode.includes('PPTX_BACKGROUND_STYLE_REFERENCE_UNRESOLVED'), '고정 PPTX 배경 참조 수정 누락');
assert.ok((await readdir(resolve(root, 'assets'))).some(name => /^packageWorker-[\w-]+\.js$/.test(name)), 'PPTX 원본 점검의 로컬 ZIP Worker 누락');

for (const role of ['launcher', 'player', 'remote', 'editor']) {
  const htmlPath = resolve(root, role, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, `${role}: 실행 스크립트 누락`);
  for (const [, attributes, body] of scripts) {
    assert.equal(body.trim(), '', `${role}: 인라인 스크립트는 MV3 CSP에 맞지 않음`);
    const src = attributes.match(/\bsrc="([^"]+)"/)?.[1];
    assert.ok(src && !/^(?:https?:|\/\/|data:)/i.test(src), `${role}: 로컬 스크립트 필요`);
    const target = resolve(dirname(htmlPath), src);
    assert.ok(!relative(root, target).startsWith('..'), '패키지 밖의 경로');
    await access(target);
  }
}
console.log('MV3 산출물: manifest, worker, 4개 HTML 및 로컬 스크립트 경로 확인 완료.');
