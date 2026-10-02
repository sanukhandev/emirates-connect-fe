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

  test('applies real industry, emirate, verification and combined filters', async ({ page }) => {
    const run = process.env['EC12_SEARCH_RUN_ID'];
    if (!run) throw new Error('EC12_SEARCH_RUN_ID is required for deterministic search fixtures');
    const marker = run;
    const techDubai = `ec12e5-filter-tech-dubai-${run}`;
    const logisticsDubai = `ec12e5-filter-logistics-dubai-${run}`;
    const techAbuDhabi = `ec12e5-filter-tech-abu-${run}`;

    await page.goto(`/search?q=${marker}&type=businesses`);
    await expect(page.getByRole('link', { name: new RegExp(techDubai) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(logisticsDubai) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(techAbuDhabi) })).toBeVisible();

    await page.getByLabel('Industry').selectOption('technology');
    await expect(page).toHaveURL(/industry=technology/);
    await expect(page.getByRole('link', { name: new RegExp(techDubai) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(techAbuDhabi) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(logisticsDubai) })).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel('Industry')).toHaveValue('technology');
    await expect(page.getByRole('link', { name: new RegExp(techDubai) })).toBeVisible();

    await page.getByLabel('Emirate').selectOption('dubai');
    await expect(page).toHaveURL(/emirate=dubai/);
    await expect(page.getByRole('link', { name: new RegExp(techDubai) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(techAbuDhabi) })).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel('Emirate')).toHaveValue('dubai');

    await page.getByLabel('Verification').selectOption('true');
    await expect(page).toHaveURL(/verified=true/);
    await expect(page.getByRole('link', { name: new RegExp(techDubai) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(logisticsDubai) })).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByLabel('Verification').selectOption('false');
    await expect(page).toHaveURL(/verified=false/);
    await expect(page.getByRole('link', { name: new RegExp(logisticsDubai) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(techAbuDhabi) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(techDubai) })).toHaveCount(0);

    await page.goto(`/search?q=${techDubai}&type=businesses&industry=technology&emirate=dubai&verified=true`);
    await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(techDubai);
    await expect(page.getByRole('button', { name: 'Businesses' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Industry')).toHaveValue('technology');
    await expect(page.getByLabel('Emirate')).toHaveValue('dubai');
    await expect(page.getByLabel('Verification')).toHaveValue('true');
    await expect(page.getByRole('link', { name: new RegExp(techDubai) })).toBeVisible();
    await expect(page.getByRole('link', { name: new RegExp(logisticsDubai) })).toHaveCount(0);
    await expect(page.getByRole('link', { name: new RegExp(techAbuDhabi) })).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).toHaveURL(new RegExp(`search\\?q=${techDubai}$`));
    await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue(techDubai);

    await page.goto('/search?industry=technology');
    await expect(page.getByLabel('Industry')).toHaveValue('technology');
    await expect(page.getByText('Unable to load search results.')).toHaveCount(0);
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search people and businesses' })).toBeVisible();
  });

  test('loads real business pagination, preserves order and resets state', async ({ page }) => {
    const run = process.env['EC12_SEARCH_RUN_ID'];
    if (!run) throw new Error('EC12_SEARCH_RUN_ID is required for deterministic search fixtures');
    const marker = `ec12e5-page-${run}`;
    const searchResponse = (pageNumber: number) => page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.includes('/api/v1/search') && url.searchParams.get('q') === marker && url.searchParams.get('page') === String(pageNumber);
    });

    const firstResponsePromise = searchResponse(1);
    await page.goto(`/search?q=${marker}&type=businesses`);
    const firstResponse = await firstResponsePromise;
    const firstBody = await firstResponse.json() as { data: Array<{ slug: string }> };
    const firstExpected = firstBody.data.map((item) => `/businesses/${item.slug}`);
    const firstLinks = page.locator('a[href^="/businesses/"]');
    await expect(firstLinks).toHaveCount(firstExpected.length);
    await expect(firstLinks).toHaveCount(20);
    expect(await firstLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(firstExpected);

    const secondResponsePromise = searchResponse(2);
    await page.getByRole('button', { name: 'Load more' }).click();
    const secondBody = await (await secondResponsePromise).json() as { data: Array<{ slug: string }> };
    const secondExpected = secondBody.data.map((item) => `/businesses/${item.slug}`);
    await expect(firstLinks).toHaveCount(25);
    expect(await firstLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual([...firstExpected, ...secondExpected]);
    expect(new Set(await firstLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).size).toBe(25);
    await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);

    const filterResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname.includes('/api/v1/search') && url.searchParams.get('q') === marker && url.searchParams.get('emirate') === 'abu-dhabi' && url.searchParams.get('page') === '1';
    });
    await page.getByLabel('Emirate').selectOption('abu-dhabi');
    await filterResponse;
    await expect(firstLinks).toHaveCount(0);

    const resetFirstResponse = searchResponse(1);
    await page.goto(`/search?q=${marker}&type=businesses`);
    await resetFirstResponse;
    const secondLoad = searchResponse(2);
    await page.getByRole('button', { name: 'Load more' }).click();
    await secondLoad;
    const queryResponse = page.waitForResponse((response) => new URL(response.url()).searchParams.get('q') === 'ec12e5-does-not-exist');
    await page.getByRole('searchbox', { name: 'Search' }).fill('ec12e5-does-not-exist');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await queryResponse;
    await expect(page).toHaveURL(/q=ec12e5-does-not-exist/);
    await expect(firstLinks).toHaveCount(0);
  });

  test('does not let a delayed search response overwrite the latest query', async ({ page }) => {
    const queryA = `ec12e5-race-alpha-${Date.now()}`;
    const queryB = `ec12e5-race-beta-${Date.now()}`;
    let releaseA: (() => Promise<void>) | undefined;
    const capturedA = new Promise<void>((resolve) => {
      void page.route('**/api/v1/search**', async (route) => {
        const query = new URL(route.request().url()).searchParams.get('q');
        if (query === queryA) {
          releaseA = () => route.continue();
          resolve();
          return;
        }
        await route.continue();
      });
    });

    await page.goto('/search');
    await page.getByRole('searchbox', { name: 'Search' }).fill(queryA);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await capturedA;

    const fastB = page.waitForResponse((response) => new URL(response.url()).searchParams.get('q') === queryB);
    await page.getByRole('searchbox', { name: 'Search' }).fill(queryB);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await fastB;
    await expect(page).toHaveURL(new RegExp(`q=${queryB}`));
    await expect(page.getByText('No results found.')).toBeVisible();

    const slowA = page.waitForResponse((response) => new URL(response.url()).searchParams.get('q') === queryA);
    if (!releaseA) throw new Error('Delayed search request was not captured');
    await releaseA();
    await slowA;
    await expect(page).toHaveURL(new RegExp(`q=${queryB}`));
    await expect(page.getByText('No results found.')).toBeVisible();
    await page.unroute('**/api/v1/search**');
  });
});
