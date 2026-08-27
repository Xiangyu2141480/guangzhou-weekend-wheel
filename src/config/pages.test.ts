import type { ConfigEnv, UserConfig } from 'vite';
import { expect, test } from 'vitest';
import viteConfig from '../../vite.config';

test('uses the GitHub Pages repository base path in production', () => {
  const factory = viteConfig as (environment: ConfigEnv) => UserConfig;
  const config = factory({
    command: 'build',
    mode: 'production',
    isSsrBuild: false,
    isPreview: false,
  });

  expect(config.base).toBe('/guangzhou-weekend-wheel/');
  expect(config.test?.exclude).toContain('.worktrees/**');
});
