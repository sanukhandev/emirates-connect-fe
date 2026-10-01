import { expect, Page, test } from '@playwright/test';

const avatarOne = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const avatarTwo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const coverOne = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8Qf//Z', 'base64');
const coverTwo = coverOne;

const upload = async (page: Page, label: string, endpoint: string, file: { name: string; mimeType: string; buffer: Buffer }) => {
  const response = page.waitForResponse((candidate) => candidate.url().endsWith(endpoint) && candidate.request().method() === 'POST');
  await page.getByLabel(label).setInputFiles(file);
  const result = await response;
  expect(result.ok()).toBeTruthy();
};

test('validates avatar and cover media lifecycles', async ({ page }) => {
  const email = process.env['EC_E2E_EMAIL'];
  const password = process.env['EC_E2E_PASSWORD'];
  test.skip(!email || !password, 'Set EC_E2E_EMAIL and EC_E2E_PASSWORD for the local development account.');

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/($|profile|onboarding)/);
  await page.goto('/profile/edit');

  const avatarInput = { name: 'avatar-1.png', mimeType: 'image/png', buffer: avatarOne };
  await upload(page, 'Replace avatar', '/api/v1/me/profile/avatar', avatarInput);
  await expect(page.locator('img[alt$="profile photo"]')).toHaveCount(1);
  const firstAvatar = await page.locator('img[alt$="profile photo"]').getAttribute('src');
  await page.reload();
  await expect(page.locator('img[alt$="profile photo"]')).toHaveCount(1);

  await upload(page, 'Replace avatar', '/api/v1/me/profile/avatar', { ...avatarInput, name: 'avatar-2.png', buffer: avatarTwo });
  const secondAvatar = await page.locator('img[alt$="profile photo"]').getAttribute('src');
  expect(secondAvatar).not.toBe(firstAvatar);
  await page.reload();
  await expect(page.locator('img[alt$="profile photo"]')).toHaveCount(1);

  const deleteAvatar = page.waitForResponse((response) => response.url().endsWith('/api/v1/me/profile/avatar') && response.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Remove avatar' }).click();
  expect((await deleteAvatar).ok()).toBeTruthy();
  await expect(page.locator('img[alt$="profile photo"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('img[alt$="profile photo"]')).toHaveCount(0);

  await upload(page, 'Replace cover', '/api/v1/me/profile/cover-image', { name: 'cover-1.jpg', mimeType: 'image/jpeg', buffer: coverOne });
  await expect(page.locator('img[alt=""]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('img[alt=""]')).toHaveCount(1);
  await upload(page, 'Replace cover', '/api/v1/me/profile/cover-image', { name: 'cover-2.jpg', mimeType: 'image/jpeg', buffer: coverTwo });
  await page.reload();
  await expect(page.locator('img[alt=""]')).toHaveCount(1);

  const deleteCover = page.waitForResponse((response) => response.url().endsWith('/api/v1/me/profile/cover-image') && response.request().method() === 'DELETE');
  await page.getByRole('button', { name: 'Remove cover' }).click();
  expect((await deleteCover).ok()).toBeTruthy();
  await expect(page.locator('img[alt=""]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('img[alt=""]')).toHaveCount(0);

  await page.getByLabel('Replace avatar').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(page.getByText(/Use a JPEG, PNG, or WebP image up to 5 MB/)).toBeVisible();
  await page.getByLabel('Replace cover').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(page.getByText(/Use a JPEG, PNG, or WebP image up to 8 MB/)).toBeVisible();
});
