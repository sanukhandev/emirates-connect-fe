import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './business/helpers';

test.describe('EC-012 search and discovery', () => {
  test.setTimeout(120_000);

  test('renders mixed backend-ranked results and URL-driven type filters', async ({ page }) => {
    let searchAuthorization: string | undefined;
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/search')) searchAuthorization = request.headers().authorization;
    });
    const term = `EC012${Date.now()}`;
    const user = await createTestUser(page, `${term}-person`);
    const business = await createBusiness(page, `${term}-business`);

    await page.goto(`/search?q=${term}`);
    await expect(page.getByRole('heading', { name: 'Search people and businesses' })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(`${term}-person`, 'i') })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(business.name) })).toBeVisible();
    expect(searchAuthorization).toBeUndefined();
    expect(await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)].some((key) => /token|bearer|jwt|auth/i.test(key)))).toBe(false);

    await page.getByRole('button', { name: 'People' }).click();
    await expect(page).toHaveURL(/type=users/);
    await expect(page.getByRole('link', { name: new RegExp(`${term}-person`, 'i') })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(business.name) })).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`search\\?q=${term}$`));
    await page.getByRole('button', { name: 'Businesses' }).click();
    await expect(page).toHaveURL(/type=businesses/);
    await expect(page.getByRole('link', { name: new RegExp(business.name) })).toBeVisible();
    await expect(page.getByRole('link', { name: /EC005 search-person/i })).toHaveCount(0);
    expect(user.userId).toBeGreaterThan(0);
  });

  test('allows guest search without redirecting to login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search people and businesses' })).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
    await page.getByRole('searchbox', { name: 'Search' }).fill('zzzz-no-result');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('No results found.')).toBeVisible();
    for (const width of [320, 375, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/search?q=zzzz-no-result');
      await expect(page.getByText('No results found.')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await context.close();
  });
});
