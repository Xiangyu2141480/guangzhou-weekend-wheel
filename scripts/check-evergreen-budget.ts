import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function measurePayloadBudget(directory: string, limit: number) {
  const files: { path: string; bytes: number }[] = [];
  async function walk(path: string) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) await walk(child);
      else files.push({ path: relative(directory, child).split(sep).join('/'), bytes: (await stat(child)).size });
    }
  }
  await walk(directory);
  const cityFiles = files.filter((file) => file.path.startsWith('data/evergreen/') && file.path.endsWith('.json'));
  if (cityFiles.length === 0) throw new Error('Build has no generated evergreen city JSON');
  const javascriptBytes = files.filter((file) => file.path.endsWith('.js')).reduce((total, file) => total + file.bytes, 0);
  const largestCityBytes = Math.max(...cityFiles.map((file) => file.bytes));
  const evergreenJsonTotalBytes = cityFiles.reduce((total, file) => total + file.bytes, 0);
  const allJsonBytes = files.filter((file) => file.path.endsWith('.json')).reduce((total, file) => total + file.bytes, 0);
  const initialCityBytes = javascriptBytes + largestCityBytes;
  return { javascriptBytes, largestCityBytes, evergreenJsonTotalBytes, allJsonBytes, initialCityBytes, limit, passed: initialCityBytes <= limit };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const config = JSON.parse(await readFile(join(root, 'scripts/performance-budget.json'), 'utf8')) as { budget: { javascriptBytes: number } };
  const result = await measurePayloadBudget(join(root, 'dist'), config.budget.javascriptBytes);
  console.log(`${result.passed ? 'PASS' : 'FAIL'} all JS + largest city JSON: ${result.initialCityBytes} / ${result.limit} bytes (${result.javascriptBytes} JS + ${result.largestCityBytes} city)`);
  console.log(`All evergreen JSON: ${result.evergreenJsonTotalBytes} bytes; all JSON including live snapshots/manifest: ${result.allJsonBytes} bytes`);
  if (!result.passed) process.exitCode = 1;
}
