// @vitest-environment node
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { CITY_IDS } from '../src/data/cities';
import { getEvergreenActivities } from '../src/data/evergreen';
import { decodeEvergreenPayload } from '../src/data/evergreenCodec';
import { buildEvergreen } from './build-evergreen';

it('generates exactly one lossless payload per registered city with real byte totals', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'weekend-evergreen-'));
  try {
    const result = await buildEvergreen(directory);
    const target = join(directory, 'public/data/evergreen');
    expect((await readdir(target)).sort()).toEqual(CITY_IDS.map((id) => `${id}.json`).sort());
    let bytes = 0;
    for (const cityId of CITY_IDS) {
      const file = await readFile(join(target, `${cityId}.json`));
      bytes += file.byteLength;
      expect(decodeEvergreenPayload(JSON.parse(file.toString()), cityId)).toStrictEqual(getEvergreenActivities(cityId));
    }
    expect(result.totalBytes).toBe(bytes);
    expect(result.entries).toHaveLength(CITY_IDS.length);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
