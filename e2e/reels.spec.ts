import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './business/helpers';

const tinyMp4 = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');

test.describe('EC-013 reels', () => {
  test.setTimeout(180_000);

  test('creates, plays, edits, lists, and deletes a user reel', async ({ page, browser }) => {
    const user = await createTestUser(page, 'reel-creator');
    await page.goto('/reels/create');
    await page.getByLabel('Caption (optional)').fill('A synthetic professional reel.');
    await page.getByLabel('Video').setInputFiles({ name: 'not-a-video.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('image') });
    await expect(page.getByText('Please choose an MP4 video.')).toBeVisible();
    await page.getByLabel('Video').setInputFiles({ name: 'synthetic.mp4', mimeType: 'video/mp4', buffer: tinyMp4 });
    const upload = page.waitForResponse((response) => response.url().includes('/api/v1/reels/') && response.url().endsWith('/video') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish reel' }).click();
    expect((await upload).ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/reels\/\d+$/);
    await expect(page.locator('video')).toBeVisible();
    await expect(page.getByText('A synthetic professional reel.')).toBeVisible();

    await page.goto('/my-reels');
    await expect(page.getByText('A synthetic professional reel.')).toBeVisible();
    await page.getByRole('button', { name: 'Edit caption' }).click();
    await page.getByLabel('Caption').fill('Updated synthetic reel.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Updated synthetic reel.')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Updated synthetic reel.')).toHaveCount(0);

    expect(user.userId).toBeGreaterThan(0);
    const guest = await browser.newPage();
    await guest.goto('/reels');
    await expect(guest).not.toHaveURL(/\/login/);
    await expect(guest.getByRole('heading', { name: 'Reels' })).toBeVisible();
    await guest.goto('/reels/create');
    await expect(guest).toHaveURL(/\/login/);
    for (const width of [320, 375, 768, 1024]) {
      await guest.setViewportSize({ width, height: 900 });
      await guest.goto('/reels');
      await expect(guest.getByRole('heading', { name: 'Reels' })).toBeVisible();
      expect(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await guest.close();
  });

  test('creates a business-authored reel from the managed author selector', async ({ page }) => {
    await createTestUser(page, 'reel-business-owner');
    const business = await createBusiness(page, 'Reel Publisher');
    await page.goto('/reels/create');
    await expect(page.locator('#author option', { hasText: business.name })).toHaveCount(1);
    await page.locator('#author').selectOption({ index: 1 });
    await page.getByLabel('Caption (optional)').fill('A business reel.');
    await page.getByLabel('Video').setInputFiles({ name: 'business.mp4', mimeType: 'video/mp4', buffer: tinyMp4 });
    await page.getByRole('button', { name: 'Publish reel' }).click();
    await expect(page).toHaveURL(/\/reels\/\d+$/);
    await expect(page.getByText('A business reel.')).toBeVisible();
    await expect(page.getByRole('link', { name: business.name })).toBeVisible();
  });
});
