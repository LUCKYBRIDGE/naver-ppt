import { readdir, stat } from 'node:fs/promises';
import { join, relative, resolve, extname, basename } from 'node:path';

const root = resolve(process.argv[2] ?? 'test-materials');
const originals = resolve(root, 'originals');
const references = resolve(root, 'powerpoint-reference');
const list = async directory => (await readdir(directory, { withFileTypes: true }).catch(() => [])).filter(entry => entry.isFile());
const sourceFiles = await list(originals), referenceFiles = await list(references);
const refNames = new Set(referenceFiles.map(file => basename(file.name, extname(file.name)).toLocaleLowerCase()));
const sources = await Promise.all(sourceFiles.map(async file => ({ name: file.name, bytes: (await stat(join(originals, file.name))).size, reference: refNames.has(basename(file.name, extname(file.name)).toLocaleLowerCase()) })));
const report = { root: relative(process.cwd(), root) || '.', sourceCount: sources.length, pairedCount: sources.filter(source => source.reference).length, sources: sources.map(source => ({ ...source })) };
process.stdout.write(`${JSON.stringify(report)}\n`);
