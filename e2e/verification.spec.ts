import { expect, test, type Page } from '@playwright/test';

import { addMember, createBusiness, createTestUser } from './business/helpers';

const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');

async function loginE2eAdmin(page: Page): Promise<void> {
  const email = process.env.EC_E2E_ADMIN_EMAIL;
  const password = process.env.EC_E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('EC_E2E_ADMIN_EMAIL and EC_E2E_ADMIN_PASSWORD are required.');
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.locator('#login-password').fill(password);
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/auth/login') && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  expect((await response).ok()).toBeTruthy();
}

async function adminRequest(page: Page, path: string, method: 'GET' | 'POST', body?: Record<string, string>): Promise<{ status: number; body: { data?: Array<{ id: number; subject_type: string; subject_id: number }> } }> {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  return page.evaluate(async ({ apiBaseUrl, path, method, body }) => {
    const xsrfCookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='));
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.substring('XSRF-TOKEN='.length)) } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() } as { status: number; body: { data?: Array<{ id: number; subject_type: string; subject_id: number }> } };
  }, { apiBaseUrl, path, method, body });
}

async function currentVerificationId(page: Page, endpoint: string): Promise<number> {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  return page.evaluate(async ({ apiBaseUrl, endpoint }) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, { credentials: 'include' });
      const body = (await response.json()) as { data: { request: { id: number } | null } };
      if (body.data.request) return body.data.request.id;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error('Verification request did not become available after submission.');
  }, { apiBaseUrl, endpoint });
}

async function reviewVerification(page: Page, verificationId: number, action: 'approve' | 'reject', rejectionReason?: string): Promise<void> {
  const response = await adminRequest(page, `/admin/verifications/${verificationId}/${action}`, 'POST', rejectionReason ? { rejection_reason: rejectionReason } : undefined);
  expect(response.status).toBe(200);
}

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
    expect((await adminRequest(adminPage, '/admin/verifications', 'GET')).status).toBe(403);
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

  test('drives user approval, public badge, rejection, and resubmission through the real admin API', async ({ page, browser }) => {
    const user = await createTestUser(page, 'verification-admin-approved');
    await page.goto('/verification');
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    await page.getByLabel('Legal name').fill('Approved Lifecycle User');
    await page.locator('#verification-documents').setInputFiles({ name: 'approved.pdf', mimeType: 'application/pdf', buffer: pdf });
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
    const approvedUserVerificationId = await currentVerificationId(page, '/verification/user');

    const admin = await browser.newPage();
    await loginE2eAdmin(admin);
    await reviewVerification(admin, approvedUserVerificationId, 'approve');
    await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
    await expect(page.getByText('Profile verified', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit again', exact: true })).toHaveCount(0);
    await page.goto(`/users/${user.userId}`);
    await expect(page.getByLabel('Verified profile')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Verified profile')).toBeVisible();
    await admin.close();

    const rejectedPage = await browser.newPage();
    const rejectedUser = await createTestUser(rejectedPage, 'verification-admin-rejected');
    await rejectedPage.goto('/verification');
    await rejectedPage.getByRole('button', { name: 'Start verification', exact: true }).click();
    await rejectedPage.getByLabel('Legal name').fill('Rejected Lifecycle User');
    await rejectedPage.locator('#verification-documents').setInputFiles({ name: 'rejected.pdf', mimeType: 'application/pdf', buffer: pdf });
    await rejectedPage.getByRole('button', { name: 'Submit for review', exact: true }).click();
    const rejectedUserVerificationId = await currentVerificationId(rejectedPage, '/verification/user');
    const rejectAdmin = await browser.newPage();
    await loginE2eAdmin(rejectAdmin);
    const reason = 'The submitted document could not be validated.';
    await reviewVerification(rejectAdmin, rejectedUserVerificationId, 'reject', reason);
    await rejectedPage.getByRole('button', { name: 'Refresh status', exact: true }).click();
    await expect(rejectedPage.getByText('Verification needs attention', { exact: true })).toBeVisible();
    await expect(rejectedPage.locator('body')).toContainText(reason);
    await rejectedPage.getByRole('button', { name: 'Submit again', exact: true }).click();
    await rejectedPage.getByLabel('Legal name').fill('Rejected Lifecycle User Resubmission');
    await rejectedPage.locator('#verification-documents').setInputFiles({ name: 'resubmitted.pdf', mimeType: 'application/pdf', buffer: pdf });
    await rejectedPage.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await expect(rejectedPage.getByText('Pending review', { exact: true })).toBeVisible();
    const guest = await browser.newPage();
    await guest.goto(`/users/${rejectedUser.userId}`);
    await expect(guest.getByText('Verification needs attention', { exact: true })).toHaveCount(0);
    await expect(guest.getByText(reason, { exact: true })).toHaveCount(0);
    await expect(guest.getByText('rejected.pdf', { exact: true })).toHaveCount(0);
    await guest.close();
    await rejectAdmin.close();
    await rejectedPage.close();
  });

  test('drives business approval and rejection privacy through the real admin API', async ({ page, browser }) => {
    await createTestUser(page, 'verification-business-approved');
    const approvedBusiness = await createBusiness(page, 'Verification Approved');
    await page.goto(`/businesses/${approvedBusiness.slug}/verification`);
    await page.getByRole('button', { name: 'Start verification', exact: true }).click();
    await page.getByLabel('Legal business name').fill('Approved Verification LLC');
    await page.getByLabel('Registration number').fill('APPROVED-E2E-001');
    await page.locator('#verification-documents').setInputFiles({ name: 'trade-licence.pdf', mimeType: 'application/pdf', buffer: pdf });
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    const approvedBusinessVerificationId = await currentVerificationId(page, `/verification/business/${approvedBusiness.slug}`);
    const admin = await browser.newPage();
    await loginE2eAdmin(admin);
    await reviewVerification(admin, approvedBusinessVerificationId, 'approve');
    await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
    await expect(page.getByText('Business verified', { exact: true })).toBeVisible();
    await page.goto(`/businesses/${approvedBusiness.slug}`);
    await expect(page.getByLabel('Verified business')).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Verified business')).toBeVisible();
    await admin.close();

    const rejectedPage = await browser.newPage();
    await createTestUser(rejectedPage, 'verification-business-rejected');
    const rejectedBusiness = await createBusiness(rejectedPage, 'Verification Rejected');
    await rejectedPage.goto(`/businesses/${rejectedBusiness.slug}/verification`);
    await rejectedPage.getByRole('button', { name: 'Start verification', exact: true }).click();
    await rejectedPage.getByLabel('Legal business name').fill('Rejected Verification LLC');
    await rejectedPage.getByLabel('Registration number').fill('REJECTED-E2E-001');
    await rejectedPage.locator('#verification-documents').setInputFiles({ name: 'rejected-trade.pdf', mimeType: 'application/pdf', buffer: pdf });
    await rejectedPage.getByRole('button', { name: 'Submit for review', exact: true }).click();
    const rejectedBusinessVerificationId = await currentVerificationId(rejectedPage, `/verification/business/${rejectedBusiness.slug}`);
    const rejectAdmin = await browser.newPage();
    await loginE2eAdmin(rejectAdmin);
    await reviewVerification(rejectAdmin, rejectedBusinessVerificationId, 'reject', 'The business document needs clarification.');
    await rejectedPage.getByRole('button', { name: 'Refresh status', exact: true }).click();
    await expect(rejectedPage.getByText('Verification needs attention', { exact: true })).toBeVisible();
    await rejectedPage.goto(`/businesses/${rejectedBusiness.slug}`);
    await expect(rejectedPage.getByText('Verification needs attention', { exact: true })).toHaveCount(0);
    await expect(rejectedPage.getByText('The business document needs clarification.', { exact: true })).toHaveCount(0);
    await expect(rejectedPage.getByText('rejected-trade.pdf', { exact: true })).toHaveCount(0);
    await rejectAdmin.close();
    await rejectedPage.close();
  });
});
