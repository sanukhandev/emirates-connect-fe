import { expect, test, type Page } from '@playwright/test';

import { provisionPerformanceFixture, type PerformanceFixture } from './performance-fixtures';

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';

async function login(page: Page, fixture: PerformanceFixture): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(fixture.email);
  await page.locator('#login-password').fill(fixture.password);
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/auth/login') && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  expect((await response).ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('EC-018 frontend performance', () => {
  test.setTimeout(180_000);

  test('loads feed pages with one request per load-more and no duplicate posts', async ({ page }) => {
    const fixture = provisionPerformanceFixture();
    const feedRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (request.method() === 'GET' && url.pathname === '/api/v1/feed') feedRequests.push(url.search);
    });

    await login(page, fixture);
    const cards = page.locator('article[data-post-id]');
    await expect(cards).toHaveCount(20, { timeout: 30_000 });
    expect(feedRequests).toHaveLength(1);

    for (const expectedCount of [40, 60]) {
      const response = page.waitForResponse((candidate) => candidate.url().includes('/api/v1/feed') && candidate.request().method() === 'GET');
      await page.getByRole('button', { name: 'Load more', exact: true }).click();
      expect((await response).ok()).toBeTruthy();
      await expect(cards).toHaveCount(expectedCount);
      expect(feedRequests).toHaveLength(expectedCount / 20);
    }

    const ids = await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-post-id')));
    expect(new Set(ids).size).toBe(ids.length);
    expect(feedRequests.map((search) => new URLSearchParams(search).get('cursor')).filter(Boolean)).toHaveLength(2);
  });

  test('loads notification pages without duplicate unread-count or list requests', async ({ page }) => {
    const fixture = provisionPerformanceFixture();
    const unreadRequests: string[] = [];
    const listResponses: Array<{ ids: number[]; cursor: string | null }> = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (request.method() === 'GET' && url.pathname === '/api/v1/notifications/unread-count') unreadRequests.push(url.search);
    });

    await login(page, fixture);
    await expect.poll(() => unreadRequests.length, { timeout: 30_000 }).toBe(1);
    const initialList = page.waitForResponse((candidate) => candidate.url().includes('/api/v1/notifications?') && candidate.request().method() === 'GET');
    await page.getByRole('link', { name: /Notifications/ }).click();
    await expect(page).toHaveURL(/\/notifications/);

    const initialResponse = await initialList;
    const initialBody = await initialResponse.json() as { data: Array<{ id: number }>; meta?: { next_cursor?: string | null } };
    listResponses.push({ ids: initialBody.data.map((item) => item.id), cursor: initialBody.meta?.next_cursor ?? null });
    expect(listResponses).toHaveLength(1);
    for (let pageNumber = 0; pageNumber < 2; pageNumber += 1) {
      const request = page.waitForResponse((candidate) => candidate.url().includes('/api/v1/notifications?') && candidate.request().method() === 'GET');
      await page.getByRole('button', { name: 'Load more', exact: true }).click();
      const response = await request;
      const body = await response.json() as { data: Array<{ id: number }>; meta?: { next_cursor?: string | null } };
      listResponses.push({ ids: body.data.map((item) => item.id), cursor: body.meta?.next_cursor ?? null });
    }

    expect(listResponses).toHaveLength(3);
    expect(new Set(listResponses.flatMap((result) => result.ids)).size).toBe(fixture.notificationCount);
    expect(listResponses.slice(0, 2).every((result) => result.cursor)).toBe(true);
    expect(unreadRequests).toHaveLength(1);
  });
});
