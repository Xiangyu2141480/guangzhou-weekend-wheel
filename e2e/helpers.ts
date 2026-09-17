import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

interface RuntimeMonitorOptions {
  allowedConsoleErrors?: RegExp[];
  allowedHttpErrors?: RegExp[];
}

export function monitorRuntime(
  page: Page,
  {
    allowedConsoleErrors = [],
    allowedHttpErrors = [],
  }: RuntimeMonitorOptions = {},
) {
  const errors: string[] = [];
  const isSameOrigin = (url: string) => {
    if (page.url() === 'about:blank') return false;
    return new URL(url).origin === new URL(page.url()).origin;
  };

  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !allowedConsoleErrors.some((pattern) => pattern.test(message.text()))
    ) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (isSameOrigin(request.url())) {
      errors.push(`resource: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    if (
      response.status() >= 400 &&
      isSameOrigin(url) &&
      !allowedHttpErrors.some((pattern) => pattern.test(url))
    ) {
      errors.push(`resource: ${response.status()} ${url}`);
    }
  });

  return () => {
    expect(errors, errors.join('\n')).toEqual([]);
  };
}

export async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const violations = results.violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target.join(' ')),
    }));

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

export async function tabTo(page: Page, target: Locator, limit = 100) {
  for (let step = 0; step < limit; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}
