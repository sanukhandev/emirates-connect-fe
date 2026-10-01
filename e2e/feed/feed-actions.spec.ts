import { expect, test } from '@playwright/test';

import { createTestUser } from './helpers';

test.describe('EC-007 feed actions', () => {
  test.setTimeout(120_000);

  test('refreshes after publishing and removes an own post after deletion', async ({ page }) => {
    await createTestUser(page, 'feed-actions');
    await page.goto('/');
    const body = `Feed post for refresh and deletion ${Date.now()}.`;
    await page.getByLabel('Post text').fill(body);
    const created = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await created).ok()).toBeTruthy();
    await expect(page.getByText(body)).toBeVisible();
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByText(body)).toBeVisible();

    const card = page.locator('article[data-post-id]').filter({ hasText: body });
    await card.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByText(body)).toBeVisible();
    await card.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText(body)).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(body)).toHaveCount(0);
  });
});
