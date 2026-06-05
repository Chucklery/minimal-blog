// tests/performance.spec.js
// Playwright 性能测试 — 检查加载速度、JS 大小、无 404

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8088';

test.describe('Performance', () => {
  test('home page loads quickly', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - start;
    // 本地应 < 200ms
    expect(loadTime).toBeLessThan(2000);
  });

  test('home page has no 404/500 responses', async ({ page }) => {
    const badStatuses = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        badStatuses.push(`${response.url()} → ${response.status()}`);
      }
    });

    await page.goto(BASE_URL);
    expect(badStatuses).toEqual([]);
  });

  test('post page has no broken resources', async ({ page }) => {
    const badStatuses = [];
    page.on('response', (response) => {
      if (response.status() >= 400) {
        badStatuses.push(`${response.url()} → ${response.status()}`);
      }
    });

    await page.goto(`${BASE_URL}/posts/hello-world.html`);
    expect(badStatuses).toEqual([]);
  });

  test('JS file is reasonably sized', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/assets/main.js`);
    expect(res.ok()).toBeTruthy();
    const body = await res.body();
    const sizeKB = body.length / 1024;
    // 未压缩 < 20KB (per doc)
    expect(sizeKB).toBeLessThan(20);
  });

  test('CSS files exist and load', async ({ request }) => {
    const cssFiles = ['reset.css', 'tokens.css', 'base.css', 'layout.css', 'prose.css', 'components.css'];
    for (const file of cssFiles) {
      const res = await request.get(`${BASE_URL}/assets/${file}`);
      expect(res.ok(), `${file} should return 200`).toBeTruthy();
    }
  });

  test('scroll does not crash', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/hello-world.html`);
    // 滚动到底
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    // 验证页面仍在
    await expect(page.locator('body')).toBeVisible();
    // 进度条应可见
    const progress = page.locator('[data-progress]');
    await expect(progress).toBeVisible();
  });
});
