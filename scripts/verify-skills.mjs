import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../.agents/skills/', import.meta.url));
let count = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = resolve(root, entry.name, 'SKILL.md');
  const content = await readFile(file, 'utf8');
  const frontmatter = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  assert.ok(frontmatter, `${entry.name}: frontmatter 필요`);
  assert.ok(frontmatter[1].includes(`name: ${entry.name}`), `${entry.name}: 이름 불일치`);
  assert.match(frontmatter[1], /description: .+/);
  assert.match(entry.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(entry.name.length < 64);
  assert.ok(!content.includes('[TODO:'), `${entry.name}: 미작성 내용`);
  for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
    if (!/^(?:https?:|#)/.test(link)) await access(resolve(dirname(file), link.split('#')[0]));
  }
  count++;
}
assert.ok(count > 0);
console.log(`프로젝트 스킬 ${count}개: 이름, frontmatter, 내부 참조 확인 완료.`);
