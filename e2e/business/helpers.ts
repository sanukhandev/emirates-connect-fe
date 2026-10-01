import { expect, Page } from '@playwright/test';

export interface ProvisionedUser {
  email: string;
  password: string;
  userId: number;
}

export async function createTestUser(page: Page, roleLabel: string): Promise<ProvisionedUser> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const account = { email: `ec-e2e-${roleLabel}-${suffix}@example.test`, password: `E2e-${suffix}-Aa1!` };
  await page.goto('/register');
  await page.getByLabel('Name').fill(`EC005 ${roleLabel}`);
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByLabel('Confirm password').fill(account.password);
  const industriesLoaded = page.waitForResponse((response) => response.url().endsWith('/api/v1/meta/industries') && response.status() === 200);
  const emiratesLoaded = page.waitForResponse((response) => response.url().endsWith('/api/v1/meta/emirates') && response.status() === 200);
  const profileLoaded = page.waitForResponse((response) => response.url().endsWith('/api/v1/me/profile') && response.status() === 200);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 30_000 });
  await Promise.all([industriesLoaded, emiratesLoaded, profileLoaded]);
  await page.getByLabel('Display name').fill(`EC005 ${roleLabel}`);
  await page.getByLabel('Headline').fill(`Professional ${roleLabel}`);
  await page.getByLabel('Job title').fill('Manager');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('#onboarding-industry').selectOption({ index: 1 });
  await page.locator('#onboarding-emirate').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Bio Optional').fill(`Automated ${roleLabel} profile.`);
  await page.getByLabel('Website Optional').fill('https://example.test');
  await page.getByLabel('LinkedIn profile Optional').fill(`https://www.linkedin.com/in/ec005-${suffix}`);
  await page.getByRole('button', { name: 'Complete profile', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  return { ...account, userId: await currentUserId(page) };
}

export async function createBusiness(page: Page, label = 'Business'): Promise<{ name: string; slug: string }> {
  const name = `EC005 ${label} ${Date.now()}`;
  await page.goto('/businesses/create');
  await page.getByLabel('Business name').fill(name);
  await page.getByLabel('Industry').selectOption({ index: 1 });
  await page.getByLabel('Emirate').selectOption({ index: 1 });
  await page.getByLabel('Tagline').fill('A professional business presence.');
  await page.getByLabel('Description').fill('A focused business page for browser validation.');
  await page.getByLabel('Website').fill('https://example.com');
  await page.getByLabel('Email').fill('business@example.com');
  await page.getByLabel('Phone').fill('+971500000000');
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/businesses') && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: 'Create business', exact: true }).click();
  expect((await response).ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/businesses\/(?!create$)[\w-]+$/);
  const slug = new URL(page.url()).pathname.split('/').pop();
  if (!slug) throw new Error('Business slug was not returned in the browser URL.');
  await expect(page.getByRole('heading', { name })).toBeVisible();
  return { name, slug };
}

export async function currentUserId(page: Page): Promise<number> {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  return page.evaluate(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/me`, { credentials: 'include' });
    const body = await response.json() as { data: { id: number } };
    return body.data.id;
  }, apiBaseUrl);
}

export async function addMember(page: Page, slug: string, userId: number, role: 'admin' | 'editor'): Promise<void> {
  await page.goto(`/businesses/${slug}/members`);
  await page.getByLabel('Existing Emirates Connect User ID').fill(String(userId));
  await page.locator('#member-role').selectOption(role);
  const response = page.waitForResponse((candidate) => candidate.url().endsWith(`/api/v1/businesses/${slug}/members`) && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  expect((await response).ok()).toBeTruthy();
  await expect(page.getByText('Member added.')).toBeVisible();
}

export const logoOne = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
export const logoTwo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
export const coverOne = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8Qf//Z', 'base64');
export const coverTwo = coverOne;
