import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(join(root, 'scripts/performance-budget.json'), 'utf8'));
const assetsDirectory = join(root, 'dist/assets');
const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const totals = { javascriptBytes: 0, cssBytes: 0, imageBytes: 0, largestImageBytes: 0 };

for (const name of await readdir(assetsDirectory)) {
  const bytes = (await stat(join(assetsDirectory, name))).size;
  const extension = extname(name).toLowerCase();
  if (extension === '.js') totals.javascriptBytes += bytes;
  if (extension === '.css') totals.cssBytes += bytes;
  if (imageExtensions.has(extension)) {
    totals.imageBytes += bytes;
    totals.largestImageBytes = Math.max(totals.largestImageBytes, bytes);
  }
}

let failed = false;
for (const [metric, limit] of Object.entries(config.budget)) {
  const actual = totals[metric];
  const status = actual <= limit ? 'PASS' : 'FAIL';
  console.log(`${status} ${metric}: ${actual} / ${limit} bytes (baseline ${config.baseline[metric]})`);
  failed ||= actual > limit;
}

if (failed) process.exitCode = 1;
