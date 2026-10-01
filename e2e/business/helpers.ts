import { expect, Page } from '@playwright/test';

export interface Credentials {
  email: string;
  password: string;
}

export function credentials(role: 'owner' | 'admin' | 'editor' | 'nonMember'): Credentials | null {
  const prefix = role === 'nonMember' ? 'NON_MEMBER' : role.toUpperCase();
  const email = process.env[`E2E_${prefix}_EMAIL`] ?? (role === 'owner' ? process.env['EC_E2E_EMAIL'] : undefined);
  const password = process.env[`E2E_${prefix}_PASSWORD`] ?? (role === 'owner' ? process.env['EC_E2E_PASSWORD'] : undefined);
  return email && password ? { email, password } : null;
}

export async function loginAs(page: Page, account: Credentials): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/(?:$|profile|businesses|onboarding)/);
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
  return page.evaluate(async () => {
    const response = await fetch('/api/v1/me', { credentials: 'include' });
    const body = await response.json() as { data: { id: number } };
    return body.data.id;
  });
}

export async function addMember(page: Page, slug: string, userId: number, role: 'admin' | 'editor'): Promise<void> {
  await page.goto(`/businesses/${slug}/members`);
  await page.getByLabel('Existing Emirates Connect User ID').fill(String(userId));
  await page.getByLabel('Role').selectOption(role);
  const response = page.waitForResponse((candidate) => candidate.url().endsWith(`/api/v1/businesses/${slug}/members`) && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  expect((await response).ok()).toBeTruthy();
  await expect(page.getByText('Member added.')).toBeVisible();
}

export const logoOne = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
export const logoTwo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
export const coverOne = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8Qf//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8Qf//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8Qf//Z', 'base64');
export const coverTwo = coverOne;
