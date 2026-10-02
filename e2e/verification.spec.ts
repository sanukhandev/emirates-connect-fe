import { expect, test } from '@playwright/test';

import { addMember, createBusiness, createTestUser } from './business/helpers';

const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');

test.describe('EC-011 verification', () => {
  test.setTimeout(180_000);

  test('submits user verification and persists pending status without exposing private document URLs', async ({ page }) => {
    await createTestUser(page, 'verification-user');
    await page.goto('/verification');
    await expect(page.getByText('Verify your professional identity', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    await page.getByLabel('Legal name').fill('Synthetic Verification User');
    await page.locator('#verification-documents').setInputFiles({ name: 'identity.pdf', mimeType: 'application/pdf', buffer: pdf });
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await expect(page.getByText('Verification submitted', { exact: true })).toBeVisible();
    await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
    await expect(page.locator('a[href*="verification_private"], a[href*="storage_path"]')).toHaveCount(0);
    await expect(page.getByText('Download', { exact: true })).toHaveCount(0);

    await page.reload();
    await expect(page.getByText('Verification submitted', { exact: true })).toBeVisible();
  });

  test('submits business verification for its owner', async ({ page }) => {
    await createTestUser(page, 'verification-business-owner');
    const business = await createBusiness(page, 'Verification Target');
    await page.goto(`/businesses/${business.slug}/verification`);
    await expect(page.getByText('Verify this business', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    await page.getByLabel('Legal business name').fill('Synthetic Verification Business LLC');
    await page.getByLabel('Registration number').fill('E2E-VERIFICATION-001');
    await page.locator('#verification-documents').setInputFiles({ name: 'trade-licence.pdf', mimeType: 'application/pdf', buffer: pdf });
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await expect(page.getByText('Verification submitted', { exact: true })).toBeVisible();
    await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
  });

  test('blocks unsupported files before sending a submission', async ({ page }) => {
    await createTestUser(page, 'verification-file-validation');
    await page.goto('/verification');
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    let submitted = false;
    page.on('request', (request) => { if (request.url().endsWith('/api/v1/verification/user') && request.method() === 'POST') submitted = true; });
    await page.locator('#verification-documents').setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
    await expect(page.getByText('is not a supported document type.', { exact: false })).toBeVisible();
    expect(submitted).toBe(false);
  });

  test('blocks oversized and excessive document selections', async ({ page }) => {
    await createTestUser(page, 'verification-file-limits');
    await page.goto('/verification');
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    const input = page.locator('#verification-documents');
    await input.setInputFiles({ name: 'large.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
    await expect(page.getByText('is larger than 10 MB.', { exact: false })).toBeVisible();
    const smallFiles = Array.from({ length: 6 }, (_, index) => ({ name: `document-${index}.pdf`, mimeType: 'application/pdf', buffer: pdf }));
    await input.setInputFiles(smallFiles);
    await expect(page.getByText('up to 5 documents', { exact: false })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Selected verification documents' }).locator('li')).toHaveCount(0);
  });

  test('keeps pending status private and protects guest verification routes', async ({ page, browser }) => {
    const user = await createTestUser(page, 'verification-private-pending');
    await page.goto('/verification');
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    await page.getByLabel('Legal name').fill('Private Pending User');
    await page.locator('#verification-documents').setInputFiles({ name: 'private.pdf', mimeType: 'application/pdf', buffer: pdf });
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await expect(page.getByText('Pending review', { exact: true })).toBeVisible();

    const guest = await browser.newPage();
    const guestRequests: string[] = [];
    guest.on('request', (request) => { if (request.url().includes('/api/v1/verification/')) guestRequests.push(request.method()); });
    await guest.goto(`/users/${user.userId}`);
    await expect(guest.getByText('Pending', { exact: true })).toHaveCount(0);
    await expect(guest.getByText('Verification submitted', { exact: true })).toHaveCount(0);
    await expect(guest.getByText('private.pdf', { exact: true })).toHaveCount(0);
    await guest.goto('/verification');
    await expect(guest).toHaveURL(/\/login(?:\?.*)?$/);
    expect(guestRequests).toEqual([]);
    await guest.close();
  });

  test('supports business admins and cleanly denies editors', async ({ browser }) => {
    const ownerPage = await browser.newPage();
    await createTestUser(ownerPage, 'verification-role-owner');
    const business = await createBusiness(ownerPage, 'Verification Roles');
    const adminPage = await browser.newPage();
    const admin = await createTestUser(adminPage, 'verification-role-admin');
    const editorPage = await browser.newPage();
    const editor = await createTestUser(editorPage, 'verification-role-editor');
    await addMember(ownerPage, business.slug, admin.userId, 'admin');
    await addMember(ownerPage, business.slug, editor.userId, 'editor');

    await adminPage.goto(`/businesses/${business.slug}/verification`);
    await expect(adminPage.getByText('Verify this business', { exact: true })).toBeVisible();
    await editorPage.goto(`/businesses/${business.slug}/verification`);
    await expect(editorPage.getByText("You don't have permission to manage verification for this business.", { exact: true })).toBeVisible();
    await expect(editorPage.getByRole('button', { name: 'Start verification', exact: true })).toHaveCount(0);
    await Promise.all([ownerPage.close(), adminPage.close(), editorPage.close()]);
  });

  test('has no bearer or browser token storage and remains usable at required widths', async ({ page }) => {
    await createTestUser(page, 'verification-security-responsive');
    const authHeaders: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/verification/')) authHeaders.push(request.headers().authorization ?? '');
    });
    for (const width of [320, 375, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/verification');
      await expect(page.getByRole('button', { name: 'Start verification', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    expect(authHeaders.every((header) => header === '')).toBe(true);
    const storageKeys = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
    expect(storageKeys.some((key) => /token|bearer|jwt|access[_-]?token/i.test(key))).toBe(false);
    const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
    expect(cookieNames).toContain('XSRF-TOKEN');
  });
});
