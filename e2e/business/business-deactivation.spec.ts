import { expect, test } from '@playwright/test';
import { createBusiness, credentials, loginAs } from './helpers';

test('owner can cancel and confirm business deactivation', async ({ page }) => {
  const owner = credentials('owner');
  test.skip(!owner, 'Set owner E2E credentials.');
  await loginAs(page, owner!);
  const { slug } = await createBusiness(page, 'Deactivate');
  await page.goto(`/businesses/${slug}/edit`);
  await page.getByRole('button', { name: 'Deactivate Business' }).click();
  await expect(page.getByRole('dialog', { name: 'Deactivate this business?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.goto(`/businesses/${slug}`);
  await expect(page.getByRole('heading', { name: /EC005 Deactivate/ })).toBeVisible();
  await page.goto(`/businesses/${slug}/edit`);
  await page.getByRole('button', { name: 'Deactivate Business' }).click();
  const response = page.waitForResponse((candidate) => candidate.url().endsWith(`/api/v1/businesses/${slug}`) && candidate.request().method() === 'DELETE');
  await page.getByRole('dialog').getByRole('button', { name: 'Deactivate', exact: true }).click();
  expect((await response).ok()).toBeTruthy();
  await page.goto(`/businesses/${slug}`);
  await expect(page.getByRole('heading', { name: 'Business not found' })).toBeVisible();
});
