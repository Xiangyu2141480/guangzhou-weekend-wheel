import { expect, test } from '@playwright/test';

const mobileViewports = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

for (const viewport of mobileViewports) {
  test(`fits the ${viewport.width}px mobile viewport`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    await page.goto('./');

    await expect(page.getByRole('heading', { name: '今天去哪汪？' })).toBeVisible();
    await expect(page.getByLabel('广州周末随机转盘')).toBeVisible();
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
    const candidateIds = (await page.getByLabel('广州周末随机转盘').getAttribute('data-candidate-ids'))?.split(',');
    expect(candidateIds).toHaveLength(10);
    await page.close();
  });
}

test('keeps the stopped sector and result card consistent, then persists a favorite', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const wheel = page.getByLabel('广州周末随机转盘');

  await page.getByRole('button', { name: '开转！' }).click();
  await expect(page.getByRole('button', { name: '命运选择中……' })).toBeDisabled();
  const candidateIds = (await wheel.getAttribute('data-candidate-ids'))!.split(',');
  const dialog = page.getByRole('dialog', { name: '命运决定了！' });
  await expect(dialog).toBeVisible({ timeout: 6_000 });
  const selectedIndex = Number(await wheel.getAttribute('data-selected-index'));
  const resultId = await dialog.getAttribute('data-activity-id');
  expect(resultId).toBe(candidateIds[selectedIndex]);

  await dialog.getByRole('button', { name: '收藏这个地点' }).click();
  await expect(dialog.getByRole('button', { name: '取消收藏这个地点' })).toBeVisible();
  await expect(dialog.getByRole('link', { name: '去地图看看' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /分享|复制|下载/ })).toHaveCount(0);
  await dialog.getByRole('button', { name: '关闭结果' }).click();

  await page.reload();
  await page.getByRole('button', { name: /我的收藏，共 1 个/ }).click();
  await expect(page.getByRole('dialog', { name: '我的收藏' }).locator('li')).toHaveCount(1);
});

test('offers a one-click reset when filters have no matches', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByRole('button', { name: '演出' }).click();
  await page.getByText('再挑一点').click();
  await page.getByRole('button', { name: '¥50以内' }).click();

  await expect(page.getByRole('button', { name: '放宽一点条件' })).toBeVisible();
  await page.getByRole('button', { name: '放宽一点条件' }).click();
  await expect(page.getByLabel('广州周末随机转盘')).toBeVisible();
});
