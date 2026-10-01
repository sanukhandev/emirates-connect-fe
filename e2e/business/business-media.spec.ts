import { expect, test } from '@playwright/test';
import { createBusiness, credentials, coverOne, coverTwo, logoOne, logoTwo, loginAs } from './helpers';

test('validates logo and cover upload, persistence, replacement, deletion, and invalid MIME', async ({ page }) => {
  const owner = credentials('owner');
  test.skip(!owner, 'Set owner E2E credentials.');
  await loginAs(page, owner!);
  const { name, slug } = await createBusiness(page, 'Media');
  await page.goto(`/businesses/${slug}/edit`);

  await page.getByLabel('Replace logo').setInputFiles({ name: 'logo-1.png', mimeType: 'image/png', buffer: logoOne });
  await expect(page.getByText('Logo saved.')).toBeVisible();
  await expect(page.locator(`img[alt="${name} logo"]`)).toHaveCount(1);
  const firstLogo = await page.locator(`img[alt="${name} logo"]`).getAttribute('src');
  await page.reload();
  await expect(page.locator(`img[alt="${name} logo"]`)).toHaveCount(1);
  await page.getByLabel('Replace logo').setInputFiles({ name: 'logo-2.png', mimeType: 'image/png', buffer: logoTwo });
  await expect(page.getByText('Logo saved.')).toBeVisible();
  const secondLogo = await page.locator(`img[alt="${name} logo"]`).getAttribute('src');
  expect(secondLogo).not.toBe(firstLogo);
  await page.reload();
  await expect(page.locator(`img[alt="${name} logo"]`)).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove logo' }).click();
  await expect(page.getByText('Logo removed.')).toBeVisible();
  await expect(page.locator(`img[alt="${name} logo"]`)).toHaveCount(0);
  await page.reload();
  await expect(page.locator(`img[alt="${name} logo"]`)).toHaveCount(0);
  await page.getByLabel('Replace logo').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
  await expect(page.getByText(/Use a JPEG, PNG, or WebP image up to 5 MB/)).toBeVisible();

  await page.getByLabel('Replace cover image').setInputFiles({ name: 'cover-1.jpg', mimeType: 'image/jpeg', buffer: coverOne });
  await expect(page.getByText('Cover saved.')).toBeVisible();
  await expect(page.locator('img[alt=""]').first()).toHaveCount(1);
  await page.reload();
  await expect(page.locator('img[alt=""]').first()).toHaveCount(1);
  await page.getByLabel('Replace cover image').setInputFiles({ name: 'cover-2.jpg', mimeType: 'image/jpeg', buffer: coverTwo });
  await expect(page.getByText('Cover saved.')).toBeVisible();
  await page.reload();
  await expect(page.locator('img[alt=""]').first()).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove cover' }).click();
  await expect(page.getByText('Cover removed.')).toBeVisible();
  await page.reload();
  await expect(page.locator('img[alt=""]').first()).toHaveCount(0);
  await page.getByLabel('Replace cover image').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid') });
  await expect(page.getByText(/Use a JPEG, PNG, or WebP image up to 8 MB/)).toBeVisible();
});
