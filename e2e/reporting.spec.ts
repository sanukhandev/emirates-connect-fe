import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './business/helpers';

const tinyMp4 = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';

async function createComment(page: import('@playwright/test').Page, postId: number): Promise<number> {
  return page.evaluate(async ({ apiBaseUrl, postId }) => {
    const xsrf = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='));
    const response = await fetch(`${apiBaseUrl}/posts/${postId}/comments`, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf.slice('XSRF-TOKEN='.length)) } : {}) }, body: JSON.stringify({ author_type: 'user', body: `Reportable comment ${Date.now()}` }) });
    if (!response.ok) throw new Error(`Comment fixture failed: ${response.status}`);
    return (await response.json() as { data: { id: number } }).data.id;
  }, { apiBaseUrl, postId });
}

test.describe('EC-015 reporting', () => {
  test.setTimeout(180_000);

  test('reports user, business, post, comment, and reel targets through the real API', async ({ page, browser }) => {
    const owner = await createTestUser(page, `report-owner-${Date.now()}`);
    const business = await createBusiness(page, `Report Target ${Date.now()}`);
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill(`Reportable post ${Date.now()}`);
    const postResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const postId = ((await (await postResponse).json()) as { data: { id: number } }).data.id;
    await page.goto('/reels/create');
    await page.getByLabel('Caption (optional)').fill(`Reportable reel ${Date.now()}`);
    await page.getByLabel('Video').setInputFiles({ name: 'reportable.mp4', mimeType: 'video/mp4', buffer: tinyMp4 });
    await page.getByRole('button', { name: 'Publish reel' }).click();
    const reelId = Number(new URL(page.url()).pathname.split('/').pop());

    const commentContext = await browser.newContext();
    const commentPage = await commentContext.newPage();
    await createTestUser(commentPage, `report-commenter-${Date.now()}`);
    const commentId = await createComment(commentPage, postId);

    const reporterContext = await browser.newContext();
    const reporter = await reporterContext.newPage();
    await createTestUser(reporter, `reporter-${Date.now()}`);
    const submit = async (targetUrl: string, button: string): Promise<void> => {
      await reporter.goto(targetUrl);
      await reporter.getByRole('button', { name: button, exact: true }).click();
      await reporter.getByLabel('Reason').selectOption('spam');
      const response = reporter.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.request().method() === 'POST');
      await reporter.getByRole('button', { name: 'Submit report', exact: true }).click();
      expect((await response).status()).toBe(201);
      await expect(reporter.getByRole('status')).toContainText('Report submitted.');
    };

    await submit(`/users/${owner.userId}`, 'Report');
    await submit(`/businesses/${business.slug}`, 'Report business');
    await submit(`/posts/${postId}`, 'Report post');
    await reporter.goto(`/posts/${postId}`);
    await expect(reporter.locator(`[data-comment-id="${commentId}"]`)).toBeVisible();
    await reporter.locator(`[data-comment-id="${commentId}"]`).getByRole('button', { name: 'Report comment', exact: true }).click();
    await reporter.getByLabel('Reason').selectOption('spam');
    const commentReport = reporter.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.request().method() === 'POST');
    await reporter.getByRole('button', { name: 'Submit report', exact: true }).click();
    expect((await commentReport).status()).toBe(201);
    await expect(reporter.getByRole('status')).toContainText('Report submitted.');
    await submit(`/reels/${reelId}`, 'Report reel');

    await reporter.goto(`/users/${owner.userId}`);
    await expect(reporter.getByRole('button', { name: 'Report', exact: true })).toBeVisible();
    await reporterContext.close();
    await commentContext.close();
  });

  test('suppresses own reporting', async ({ page }) => {
    const user = await createTestUser(page, `report-own-${Date.now()}`);
    await page.goto(`/users/${user.userId}`);
    await expect(page.getByRole('button', { name: 'Report', exact: true })).toHaveCount(0);
  });
});
