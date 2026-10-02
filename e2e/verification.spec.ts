import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './business/helpers';

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
});
