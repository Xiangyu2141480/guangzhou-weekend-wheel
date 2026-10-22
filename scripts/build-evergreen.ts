import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_IDS, type CityId } from '../src/data/cities';
import { getEvergreenActivities } from '../src/data/evergreen';
import { decodeEvergreenPayload, encodeEvergreenPayload } from '../src/data/evergreenCodec';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));

export async function buildEvergreen(directory = repositoryRoot) {
  const target = join(directory, 'public/data/evergreen');
  await mkdir(target, { recursive: true });
  const entries: { cityId: CityId; count: number; bytes: number }[] = [];
  for (const cityId of CITY_IDS) {
    const activities = getEvergreenActivities(cityId);
    const payload = encodeEvergreenPayload(cityId, activities);
    decodeEvergreenPayload(payload, cityId);
    const json = JSON.stringify(payload);
    await writeFile(join(target, `${cityId}.json`), json, 'utf8');
    entries.push({ cityId, count: activities.length, bytes: Buffer.byteLength(json) });
  }
  const expected = new Set(CITY_IDS.map((city) => `${city}.json`));
  for (const filename of await readdir(target)) {
    if (filename.endsWith('.json') && !expected.has(filename)) await rm(join(target, filename));
  }
  return { entries, totalBytes: entries.reduce((total, entry) => total + entry.bytes, 0) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildEvergreen();
  for (const entry of result.entries) console.log(`Evergreen ${entry.cityId}: ${entry.count} records, ${entry.bytes} bytes`);
  console.log(`All evergreen JSON: ${result.totalBytes} bytes`);
}
