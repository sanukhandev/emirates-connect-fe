import { expect, test, type Page } from '@playwright/test';

type Fixture = {
  reporterEmail: string;
  reporterPassword: string;
  reporterId: number;
  targetUserId: number;
  duplicateUserId: number;
  otherUserId: number;
  rateLimitUserId: number;
  targetBusinessSlug: string;
  ownBusinessSlug: string;
  postId: number;
  commentId: number;
  reelId: number;
  ownPostId: number;
  ownCommentId: number;
  ownReelId: number;
};

function fixture(): Fixture {
  const value = (name: keyof Fixture): string => {
    const envName = `EC15_${String(name).replace(/[A-Z]/g, (match) => `_${match}`).toUpperCase()}`;
    const result = process.env[envName];
    if (!result) throw new Error(`Missing ${envName}`);
    return result;
  };
  return {
    reporterEmail: value('reporterEmail'), reporterPassword: value('reporterPassword'),
    reporterId: Number(value('reporterId')), targetUserId: Number(value('targetUserId')),
    duplicateUserId: Number(value('duplicateUserId')), otherUserId: Number(value('otherUserId')),
    rateLimitUserId: Number(value('rateLimitUserId')), targetBusinessSlug: value('targetBusinessSlug'),
    ownBusinessSlug: value('ownBusinessSlug'), postId: Number(value('postId')), commentId: Number(value('commentId')),
    reelId: Number(value('reelId')), ownPostId: Number(value('ownPostId')), ownCommentId: Number(value('ownCommentId')),
    ownReelId: Number(value('ownReelId')),
  };
}

async function login(page: Page, data: Fixture): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(data.reporterEmail);
  await page.locator('#login-password').fill(data.reporterPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function openReport(page: Page, button: string): Promise<void> {
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function submitRealReport(page: Page, reason = 'spam', details?: string): Promise<void> {
  await page.getByLabel('Reason').selectOption(reason);
  if (details !== undefined) await page.getByLabel('Details').fill(details);
  const request = page.waitForRequest((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.method() === 'POST');
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: 'Submit report', exact: true }).click();
  const [outgoing, result] = await Promise.all([request, response]);
  expect(result.status()).toBe(201);
  expect(outgoing.postDataJSON()).toMatchObject({ reason });
  await expect(page.getByText('Report submitted.', { exact: true }).last()).toBeVisible();
}

test.describe('EC-015 reporting', () => {
  test.setTimeout(120_000);

  test('reports all five target types through the real API', async ({ page }) => {
    const data = fixture();
    await login(page, data);
    await page.goto(`/users/${data.targetUserId}`); await openReport(page, 'Report'); await submitRealReport(page);
    await page.goto(`/businesses/${data.targetBusinessSlug}`); await openReport(page, 'Report business'); await submitRealReport(page);
    await page.goto(`/posts/${data.postId}`); await openReport(page, 'Report post'); await submitRealReport(page);
    await expect(page.locator(`[data-comment-id="${data.commentId}"]`)).toBeVisible();
    await page.locator(`[data-comment-id="${data.commentId}"]`).getByRole('button', { name: 'Report comment', exact: true }).click();
    await submitRealReport(page);
    await page.goto(`/reels/${data.reelId}`); await openReport(page, 'Report reel'); await submitRealReport(page);
  });

  test('suppresses own targets and preserves management surfaces', async ({ page }) => {
    const data = fixture();
    await login(page, data);
    await page.goto(`/users/${data.reporterId}`); await expect(page.getByRole('button', { name: 'Report', exact: true })).toHaveCount(0);
    await page.goto(`/businesses/${data.ownBusinessSlug}`); await expect(page.getByRole('button', { name: 'Report business', exact: true })).toHaveCount(0); await expect(page.getByRole('link', { name: 'Edit Business' })).toBeVisible();
    await page.goto(`/posts/${data.ownPostId}`); await expect(page.getByRole('button', { name: 'Report post', exact: true })).toHaveCount(0);
    await expect(page.locator(`[data-comment-id="${data.ownCommentId}"]`)).toBeVisible(); await expect(page.locator(`[data-comment-id="${data.ownCommentId}"]`).getByRole('button', { name: 'Report comment', exact: true })).toHaveCount(0);
    await page.goto(`/reels/${data.ownReelId}`); await expect(page.getByRole('button', { name: 'Report reel', exact: true })).toHaveCount(0);
  });

  test('requires details for Other and handles duplicate reports', async ({ page }) => {
    const data = fixture();
    await login(page, data);
    await page.goto(`/users/${data.otherUserId}`); await openReport(page, 'Report'); await page.getByLabel('Reason').selectOption('other');
    await expect(page.getByRole('button', { name: 'Submit report', exact: true })).toBeDisabled(); await expect(page.getByText(/details.*required/i)).toBeVisible();
    await submitRealReport(page, 'other', 'Fixture report details');
    await page.goto(`/users/${data.duplicateUserId}`); await openReport(page, 'Report'); await submitRealReport(page);
    await page.goto(`/users/${data.duplicateUserId}`); await openReport(page, 'Report'); await page.getByLabel('Reason').selectOption('spam');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Submit report', exact: true }).click(); expect((await response).status()).toBe(409); await expect(page.getByText(/already reported/i)).toBeVisible();
  });

  test('handles guest, rate limiting, plain text, and responsive dialog behavior', async ({ browser }) => {
    const data = fixture(); const page = await browser.newPage();
    await page.goto(`/users/${data.targetUserId}`); await expect(page.getByRole('button', { name: 'Report', exact: true })).toHaveCount(0);
    await page.route('**/api/v1/reports', async (route) => route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ message: 'Too many reports' }) }));
    await page.goto(`/users/${data.rateLimitUserId}`); await openReport(page, 'Report'); await page.getByLabel('Reason').selectOption('spam'); await page.getByRole('button', { name: 'Submit report', exact: true }).click(); await expect(page.getByText(/submitted several reports recently/i)).toBeVisible(); await page.unroute('**/api/v1/reports');
    await page.getByLabel('Details').fill('<img src=x onerror=alert(1)>'); await expect(page.locator('body img[onerror]')).toHaveCount(0);
    for (const width of [320, 375, 768, 1024]) { await page.setViewportSize({ width, height: 900 }); await page.goto(`/users/${data.rateLimitUserId}`); await openReport(page, 'Report'); await expect(page.getByLabel('Reason')).toBeVisible(); await expect(page.getByLabel('Details')).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width); await page.getByRole('button', { name: 'Cancel', exact: true }).click(); }
    await page.close();
  });
});
