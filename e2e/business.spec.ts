import { expect, test } from '@playwright/test';

const logo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const cover = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8Qf//Z', 'base64');

test('creates, edits, lists and manages business media', async ({ page }) => {
  const email = process.env['EC_E2E_EMAIL'];
  const password = process.env['EC_E2E_PASSWORD'];
  test.skip(!email || !password, 'Set EC_E2E_EMAIL and EC_E2E_PASSWORD for the local development account.');

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/(?:$|profile|businesses|onboarding)/);

  await page.goto('/businesses/create');
  await expect(page.getByRole('heading', { name: 'Create a business page' })).toBeVisible();
  const name = `E2E Business ${Date.now()}`;
  await page.getByLabel('Business name').fill(name);
  await page.getByLabel('Industry').selectOption({ index: 1 });
  await page.getByLabel('Emirate').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Create business' }).click();
  await expect(page).toHaveURL(/\/businesses\/[\w-]+$/);
  await expect(page.getByRole('heading', { name })).toBeVisible();

  const slug = new URL(page.url()).pathname.split('/').pop()!;
  await page.goto(`/businesses/${slug}/edit`);
  await page.getByLabel('Tagline').fill('A focused business presence.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Business saved.')).toBeVisible();

  await page.getByLabel('Replace logo').setInputFiles({ name: 'business-logo.png', mimeType: 'image/png', buffer: logo });
  await expect(page.getByText('Logo saved.')).toBeVisible();
  await page.getByLabel('Replace cover image').setInputFiles({ name: 'business-cover.jpg', mimeType: 'image/jpeg', buffer: cover });
  await expect(page.getByText('Cover saved.')).toBeVisible();

  await page.goto('/businesses');
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await page.getByRole('link', { name }).click();
  await expect(page).toHaveURL(new RegExp(`/businesses/${slug}$`));
});
