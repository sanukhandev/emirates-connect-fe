import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './helpers';

test.describe('EC-007 feed basics', () => {
  test.setTimeout(120_000);

  test('renders mixed chronological authors and excludes drafts', async ({ page }) => {
    const user = await createTestUser(page, 'feed-basic');
    const suffix = Date.now();
    const userBody = `Feed user update ${suffix}.`;
    const businessBody = `Feed business update ${suffix}.`;
    const draftBody = `Feed draft must stay private ${suffix}.`;

    await page.goto('/');
    await page.getByLabel('Post text').fill(userBody);
    const userPost = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await userPost).ok()).toBeTruthy();
    await expect(page.getByText(userBody)).toBeVisible();

    await page.getByLabel('Post text').fill(draftBody);
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByText(draftBody)).toHaveCount(0);

    const business = await createBusiness(page, 'Feed Publisher');
    await page.goto('/');
    await expect(page.locator('#post-author option', { hasText: business.name })).toHaveCount(1, { timeout: 30_000 });
    await page.locator('#post-author').selectOption({ label: `${business.name} (owner)` });
    await page.getByLabel('Post text').fill(businessBody);
    const businessPost = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await businessPost).ok()).toBeTruthy();
    await expect(page.getByText(businessBody)).toBeVisible();

    const cards = page.locator('article[data-post-id]');
    const businessCard = cards.filter({ hasText: businessBody });
    const userCard = cards.filter({ hasText: userBody });
    await expect(businessCard).toHaveCount(1);
    await expect(userCard).toHaveCount(1);
    await expect(businessCard).toContainText('Business');
    const cardBodies = await cards.allTextContents();
    expect(cardBodies.findIndex((text) => text.includes(businessBody))).toBeLessThan(cardBodies.findIndex((text) => text.includes(userBody)));
    await expect(page.getByText(draftBody)).toHaveCount(0);

    const authHeaders: string[] = [];
    page.on('request', (request) => { const authorization = request.headers().authorization; if (authorization) authHeaders.push(authorization); });
    await page.reload();
    await expect(page.getByText(businessBody)).toBeVisible();
    expect(authHeaders).toEqual([]);
    expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
    expect(user.userId).toBeGreaterThan(0);
  });
});
