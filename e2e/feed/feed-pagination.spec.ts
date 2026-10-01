import { expect, test } from '@playwright/test';

import { createApiPost, createTestUser } from './helpers';

test.describe('EC-007 feed pagination', () => {
  test.setTimeout(120_000);

  test('loads the next cursor page without duplicates', async ({ page }) => {
    await createTestUser(page, 'feed-pagination');
    const suffix = Date.now();
    for (let index = 1; index <= 21; index += 1) await createApiPost(page, `EC007 pagination post ${suffix}-${index}`);

    await page.goto('/');
    const cards = page.locator('article[data-post-id]');
    await expect(cards).toHaveCount(20);
    await page.getByRole('button', { name: 'Load more', exact: true }).click();
    await expect(page.getByText(`EC007 pagination post ${suffix}-1`, { exact: true })).toBeVisible();

    const ids = await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-post-id')));
    expect(ids).toHaveLength(new Set(ids).size);
    expect(ids.length).toBeGreaterThan(20);
  });
});
