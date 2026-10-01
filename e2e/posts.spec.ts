import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './business/helpers';

test.describe('EC-006 posts', () => {
  test.setTimeout(120_000);

  test('creates a published user text post', async ({ page }) => {
    await createTestUser(page, 'post-author');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('A real user-authored Emirates Connect update.');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(page.getByText('A real user-authored Emirates Connect update.')).toBeVisible();
  });

  test('creates an image post through the real file input', async ({ page }) => {
    await createTestUser(page, 'image-author');
    await page.goto('/my-posts');
    await page.locator('#post-images').setInputFiles({ name: 'post.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(page.getByAltText('Post image 1')).toBeVisible();
  });

  test('saves a draft and shows the draft management state', async ({ page }) => {
    await createTestUser(page, 'draft-author');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('A private draft for later.');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  });

  test('publishes as a managed business identity', async ({ page }) => {
    await createTestUser(page, 'business-author');
    const business = await createBusiness(page, 'Post Publisher');
    await page.goto('/my-posts');
    await page.locator('#post-author').selectOption({ label: `${business.name} (owner)` });
    await page.getByLabel('Post text').fill('An update published by the business.');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await page.goto(`/businesses/${business.slug}`);
    await expect(page.getByText('An update published by the business.')).toBeVisible();
  });
});
