import { expect, test } from '@playwright/test';
import { createBusiness, credentials, loginAs } from './helpers';

test('owner can edit business details while keeping the backend slug stable', async ({ page }) => {
  const owner = credentials('owner');
  test.skip(!owner, 'Set owner E2E credentials.');
  await loginAs(page, owner!);
  const { slug } = await createBusiness(page, 'Edit');
  const renamed = `EC005 Renamed ${Date.now()}`;
  await page.goto(`/businesses/${slug}/edit`);
  await expect(page.getByRole('button', { name: 'Deactivate Business' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Business page' })).toBeVisible();
  await page.getByLabel('Business name').fill(renamed);
  await page.getByLabel('Tagline').fill('Updated business tagline.');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Business saved.')).toBeVisible();
  await expect(page).toHaveURL(`/businesses/${slug}/edit`);
  await expect(page.getByRole('heading', { name: `Edit ${renamed}` })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(`/businesses/${slug}/edit`);
  await expect(page.getByRole('heading', { name: `Edit ${renamed}` })).toBeVisible();
  await page.goto(`/businesses/${slug}`);
  await expect(page.getByRole('heading', { name: renamed })).toBeVisible();
});
