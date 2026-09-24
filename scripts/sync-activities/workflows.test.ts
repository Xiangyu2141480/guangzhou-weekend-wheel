import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const ci = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');
const deploy = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');

const actionReference = /^\s*uses:\s+[\w./-]+@([a-f0-9]{40})(?:\s+#.*)?$/gmu;

function actionShas(workflow: string): string[] {
  return [...workflow.matchAll(actionReference)].map((match) => match[1]);
}

function expectCommandsInOrder(workflow: string, commands: readonly string[]): void {
  let previous = -1;
  for (const command of commands) {
    const current = workflow.indexOf(`run: ${command}`);
    expect(current, `${command} must be present`).toBeGreaterThan(previous);
    previous = current;
  }
}

describe('package automation contracts', () => {
  it('exposes all-city, single-city, offline validation, and data fixture scripts', () => {
    expect(packageJson.scripts).toMatchObject({
      'sync:activities': 'tsx scripts/sync-activities/index.ts --all',
      'sync:city': 'tsx scripts/sync-activities/index.ts --city',
      'sync:check': 'tsx scripts/sync-activities/index.ts --validate-only',
      'test:data': 'vitest run src/data scripts/sync-activities',
    });
  });

  it('collects exactly 20 Playwright scenarios without starting a server or browser', () => {
    const output = execFileSync(
      resolve('node_modules/.bin/playwright'),
      ['test', '--list'],
      { cwd: resolve('.'), encoding: 'utf8' },
    );
    expect(output).toMatch(/Total:\s+20 tests/u);
  });
});

describe('GitHub Actions YAML contracts', () => {
  it.each([
    ['PR CI', ci],
    ['Pages', deploy],
  ])('%s pins every action to a full commit SHA', (_name, workflow) => {
    const uses = workflow.match(/^\s*uses:\s+\S+.*$/gmu) ?? [];
    expect(uses.length).toBeGreaterThan(0);
    expect(actionShas(workflow)).toHaveLength(uses.length);
  });

  it('keeps PR validation offline and runs every release gate', () => {
    expect(ci).toContain('permissions: {}');
    expect(ci).not.toContain('npm run sync:activities');
    expectCommandsInOrder(ci, [
      'npm ci',
      'npm run sync:check',
      'npm run test:data',
      'npm run test:run',
      'npm run lint',
      'npm run build',
      'npm run budget',
      'npm audit --omit=dev --audit-level=high',
    ]);
    expect(ci).toContain('Run 20 Playwright E2E tests');
    expect(ci.match(/contents:\s+read/gu)).toHaveLength(2);
    expect(ci).not.toMatch(/contents:\s+write/u);
  });

  it('syncs and validates five-city production data before one Pages artifact', () => {
    expect(deploy).toContain('permissions: {}');
    expectCommandsInOrder(deploy, [
      'npm ci',
      'npm run sync:activities',
      'npm run sync:check',
      'npm run test:data',
      'npm run test:run',
      'npm run lint',
      'npm run build',
      'npm run budget',
    ]);
    expect(deploy).toContain('Run 20 Playwright E2E tests');
    expect(deploy).toContain('contents: read');
    expect(deploy).toContain('pages: read');
    expect(deploy).toContain('pages: write');
    expect(deploy).toContain('id-token: write');
    expect(deploy).not.toMatch(/contents:\s+write/u);
    expect(deploy.match(/actions\/upload-(?:pages-)?artifact@/gu)).toHaveLength(1);
    expect(deploy).toContain('actions/upload-pages-artifact@');
  });
});
