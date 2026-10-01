import { expect, test } from '@playwright/test';
import { createBusiness, credentials, loginAs } from './helpers';

test('renders public business details, contact links, and a neutral 404', async ({ page }) => {
  const owner = credentials('owner');
  test.skip(!owner, 'Set owner E2E credentials.');
  await loginAs(page, owner!);
  const { name, slug } = await createBusiness(page, 'Public');
  await expect(page.getByText('A professional business presence.')).toBeVisible();
  await expect(page.getByText('A focused business page for browser validation.')).toBeVisible();
  const website = page.locator('a[target="_blank"]', { hasText: 'example.com' });
  await expect(website).toHaveAttribute('href', /^https:\/\/example\.com/);
  await expect(website).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toBeVisible();
  await page.goto(`/businesses/${slug}`);
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await page.goto('/businesses/definitely-missing-business-e2e');
  await expect(page.getByRole('heading', { name: 'Business not found' })).toBeVisible();
});
