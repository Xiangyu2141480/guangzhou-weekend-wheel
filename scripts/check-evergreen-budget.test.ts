// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { measurePayloadBudget } from './check-evergreen-budget';

it('counts every JS chunk plus the largest city and reports all JSON separately', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weekend-budget-'));
  try {
    for (const path of ['assets/nested', 'data/evergreen', 'data/cities']) await mkdir(join(directory, path), { recursive: true });
    for (const [file, size] of [
      ['assets/main.js', 200], ['assets/nested/lazy.js', 100], ['data/evergreen/guangzhou.json', 70],
      ['data/evergreen/shanghai.json', 60], ['data/cities/guangzhou.json', 40], ['data/manifest.json', 30],
    ] as const) await writeFile(join(directory, file), 'x'.repeat(size));
    expect(await measurePayloadBudget(directory, 369)).toEqual({
      javascriptBytes: 300, largestCityBytes: 70, evergreenJsonTotalBytes: 130,
      allJsonBytes: 200, initialCityBytes: 370, limit: 369, passed: false,
    });
    expect((await measurePayloadBudget(directory, 370)).passed).toBe(true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

it('fails closed when a build omitted the generated city data', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weekend-empty-budget-'));
  try { await expect(measurePayloadBudget(directory, 370000)).rejects.toThrow(); }
  finally { await rm(directory, { recursive: true, force: true }); }
});
