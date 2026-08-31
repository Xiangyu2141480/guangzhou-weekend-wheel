import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { expect, test } from 'vitest';

function productionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionSourceFiles(path);
    if (!['.ts', '.tsx'].includes(extname(entry.name)) || entry.name.includes('.test.')) return [];
    return [path];
  });
}

test('contains no sharing, clipboard or share control implementation', () => {
  const source = productionSourceFiles(join(process.cwd(), 'src'))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  const forbidden = ['navigator.share', 'navigator.clipboard', 'ShareButton', '分享或复制结果', '复制结果'];

  forbidden.forEach((value) => expect(source).not.toContain(value));
});
