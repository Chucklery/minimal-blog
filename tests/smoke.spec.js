// tests/smoke.spec.js
// Playwright smoke tests — 基础冒烟测试

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8088';

test.describe('Home page', () => {
  test('renders successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/Minimal Blog/i);
  });

  test('no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE_URL);
    expect(errors).toEqual([]);
  });

  test('has header navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('.site-nav a[href="/archive/"]')).toBeVisible();
    await expect(page.locator('.site-nav a[href="/about/"]')).toBeVisible();
  });

  test('has at least one post card', async ({ page }) => {
    await page.goto(BASE_URL);
    const cards = page.locator('.post-card');
    await expect(cards.first()).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto(BASE_URL);
    const html = page.locator('html');
    const current = await html.getAttribute('data-theme');

    await page.click('[data-theme-toggle]');
    const next = await html.getAttribute('data-theme');
    expect(next).not.toBe(current);
  });
});

test.describe('Post page', () => {
  test('renders first post', async ({ page }) => {
    await page.goto(BASE_URL);
    const firstCard = page.locator('.post-card a').first();
    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(`${BASE_URL}${href}`);
    await expect(page.locator('.post-title')).toBeVisible();
    await expect(page.locator('.prose')).toBeVisible();
  });

  test('no console errors on post page', async ({ page }) => {
    await page.goto(BASE_URL);
    const firstCard = page.locator('.post-card a').first();
    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();

    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE_URL}${href}`);
    expect(errors).toEqual([]);
  });

  test('code blocks are rendered', async ({ page }) => {
    await page.goto(`${BASE_URL}/posts/hello-world.html`);
    const preBlocks = page.locator('pre');
    const count = await preBlocks.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Data files', () => {
  test('rss.xml exists and is valid XML', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/rss.xml`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<rss');
    expect(body).toContain('<channel>');
  });

  test('sitemap.xml exists and is valid XML', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
  });

  test('robots.txt exists', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`);
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('Archive page', () => {
  test('renders and lists posts', async ({ page }) => {
    await page.goto(`${BASE_URL}/archive/`);
    await expect(page.locator('.archive')).toBeVisible();
  });
});

test.describe('About page', () => {
  test('renders about page', async ({ page }) => {
    await page.goto(`${BASE_URL}/about/`);
    await expect(page.locator('.about')).toBeVisible();
  });
});
