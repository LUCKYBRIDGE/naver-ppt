import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.background.type, 'module');
assert.equal(manifest.action.default_popup, 'launcher/index.html');
assert.equal((manifest.permissions ?? []).length, 0, '기능 구현 시 권한과 검증을 함께 추가하세요.');
assert.equal((manifest.host_permissions ?? []).length, 0);
assert.equal((manifest.externally_connectable ?? {}).matches, undefined);
assert.equal(manifest.content_security_policy.extension_pages, "script-src 'self'; object-src 'self'");
await access(resolve(root, manifest.background.service_worker));

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
