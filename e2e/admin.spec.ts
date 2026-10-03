import { expect, test, type Page } from '@playwright/test';
import { AdminFixtures, provisionAdminFixtures } from './admin-fixtures';

let fixtures: AdminFixtures;

async function login(page: Page, account: { email: string; password: string }): Promise<void> {
  await page.goto('/login');
  await page.locator('#login-email').fill(account.email);
  await page.locator('#login-password').fill(account.password);
  const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login'));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await loginResponse;
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('EC-016 admin console', () => {
  test.beforeAll(() => { fixtures = provisionAdminFixtures(); });
  test.beforeEach(async ({ context }) => {
    await context.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.startsWith('http://localhost:8000')) await route.continue({ url: url.replace('http://localhost:8000', 'http://127.0.0.1:8001') });
      else await route.continue();
    });
  });
  test.setTimeout(120_000);

  test('system admin sees dashboard and mixed verification queue', async ({ page }) => {
    await login(page, fixtures.admin);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Pending verifications')).toBeVisible();
    await page.goto('/admin/verifications?status=pending');
    await expect(page.getByRole('cell', { name: 'user', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'business', exact: true }).first()).toBeVisible();
    await expect(page).toHaveURL(/status=pending/);
    await page.getByRole('link', { name: 'Open' }).first().click();
    await expect(page.getByText(/request #/)).toBeVisible();
  });

  test('system admin opens a verification document through a fresh signed URL', async ({ page }) => {
    await login(page, fixtures.admin);
    await page.goto(`/admin/verifications/${fixtures.verificationUserId}`);
    await expect(page.getByRole('heading', { name: fixtures.marker + ' Author' })).toBeVisible();
    const documentResponsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/v1/admin/verifications/${fixtures.verificationUserId}/documents/${fixtures.verificationUserDocumentId}`));
    const popupPromise = page.waitForEvent('popup');
    const accessRequestPromise = page.waitForRequest((request) => request.url().includes(`/api/v1/admin/verifications/${fixtures.verificationUserId}/documents/${fixtures.verificationUserDocumentId}`));
    await page.getByRole('button', { name: 'Open' }).click();
    const [documentResponse, popup, accessRequest] = await Promise.all([documentResponsePromise, popupPromise, accessRequestPromise]);
    expect(documentResponse.ok()).toBeTruthy();
    const payload = await documentResponse.json() as { data: { url: string; expires_at: string } };
    expect(payload.data.url).toContain(`/api/v1/admin/verifications/${fixtures.verificationUserId}/documents/${fixtures.verificationUserDocumentId}/download`);
    expect(payload.data.url).toContain('signature=');
    expect(payload.data.url).not.toContain('verification_private');
    expect(accessRequest.headers()['authorization']).toBeUndefined();
    await expect.poll(() => popup.url()).toContain('/api/v1/admin/verifications/');
    expect(popup.url()).toContain('/download');
    expect(popup.url()).toContain('signature=');
    expect(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))).toEqual({ local: [], session: [] });
    expect(await page.locator('body').innerText()).not.toContain('verification_private');
    await popup.close();
  });

  test('admin filters, audits, and moderation targets render safely', async ({ page }) => {
    await login(page, fixtures.admin);
    await page.goto('/admin/reports?status=pending&target_type=post');
    await expect(page.getByRole('cell', { name: /post #/ }).first()).toBeVisible();
    await expect(page).toHaveURL(/target_type=post/);
    await page.goto('/admin/audit/verifications');
    await expect(page.getByRole('cell', { name: 'submitted', exact: true }).first()).toBeVisible();
    await page.goto('/admin/audit/moderation');
    await expect(page.getByRole('cell', { name: 'report_reviewed', exact: true }).first()).toBeVisible();
  });

  test('admin can review verification and report actions through real APIs', async ({ page }) => {
    await login(page, fixtures.admin);
    await page.goto(`/admin/verifications/${fixtures.verificationUserId}`);
    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();
    const approve = page.waitForResponse((response) => response.url().endsWith(`/api/v1/admin/verifications/${fixtures.verificationUserId}/approve`));
    await page.getByRole('button', { name: 'Approve' }).click();
    expect((await approve).ok()).toBeTruthy();
    await expect(page.getByText('approved', { exact: true })).toBeVisible();

    await page.goto(`/admin/verifications/${fixtures.verificationBusinessId}`);
    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByLabel('Reason or resolution').fill('Document needs clarification');
    const reject = page.waitForResponse((response) => response.url().endsWith(`/api/v1/admin/verifications/${fixtures.verificationBusinessId}/reject`));
    await page.getByRole('button', { name: 'Confirm' }).click();
    expect((await reject).ok()).toBeTruthy();
    await expect(page.getByText('rejected', { exact: true })).toBeVisible();

    await page.goto(`/admin/reports/${fixtures.reportIds[2]}`);
    await expect(page.getByRole('button', { name: 'Remove content' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove content' }).click();
    await page.getByLabel('Reason or resolution').fill('Removed after review');
    const action = page.waitForResponse((response) => response.url().endsWith(`/api/v1/admin/reports/${fixtures.reportIds[2]}`) && response.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Confirm' }).click();
    expect((await action).ok()).toBeTruthy();
    await expect(page.getByText('actioned', { exact: true })).toBeVisible();
  });

  test('normal and business admins are denied and admin state is not shown', async ({ page }) => {
    await login(page, fixtures.normal);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page.getByText('EC Admin')).toHaveCount(0);
    await page.getByRole('link', { name: 'Return home' }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await login(page, fixtures.businessAdmin);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test('users and businesses pages expose safe operational fields and responsive layout', async ({ page }) => {
    await login(page, fixtures.admin);
    await page.goto('/admin/users');
    await expect(page.getByText(fixtures.admin.email)).toBeVisible();
    await page.goto(`/admin/users/${fixtures.admin.id}`);
    await expect(page.getByText('System admin', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Suspend user' })).toHaveCount(0);
    await page.goto('/admin/businesses');
    await expect(page.getByRole('cell', { name: new RegExp(`${fixtures.marker} Business `) }).first()).toBeVisible();
    const businessDetail = page.waitForResponse((response) => response.url().includes(`/api/v1/admin/businesses/${fixtures.businessId}`));
    await page.goto(`/admin/businesses/${fixtures.businessId}`);
    expect((await businessDetail).ok()).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Suspend business' })).toBeVisible();
    await page.getByRole('button', { name: 'Suspend business' }).click();
    await page.getByLabel('Reason or resolution').fill('Administrative review');
    const suspendBusiness = page.waitForResponse((response) => response.url().endsWith(`/api/v1/admin/businesses/${fixtures.businessId}/suspend`));
    await page.getByRole('button', { name: 'Confirm' }).click();
    expect((await suspendBusiness).ok()).toBeTruthy();
    await expect(page.getByText('suspended', { exact: true })).toBeVisible();

    await page.goto(`/admin/users/${fixtures.normal.id}`);
    await page.getByRole('button', { name: 'Suspend user' }).click();
    await page.getByLabel('Reason or resolution').fill('Administrative review');
    const suspendUser = page.waitForResponse((response) => response.url().endsWith(`/api/v1/admin/users/${fixtures.normal.id}/suspend`));
    await page.getByRole('button', { name: 'Confirm' }).click();
    expect((await suspendUser).ok()).toBeTruthy();
    await expect(page.getByText('suspended', { exact: true })).toBeVisible();
    for (const width of [320, 375, 768, 1024]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
  });
});
