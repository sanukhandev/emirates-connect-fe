import { expect, Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface ProvisionedUser {
  email: string;
  password: string;
  userId: number;
}

export async function createTestUser(page: Page, roleLabel: string): Promise<ProvisionedUser> {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const account = { email: `ec-e2e-${roleLabel}-${suffix}@example.test`, password: `E2e-${suffix}-Aa1!` };
  const code = String.raw`
    $user=\App\Models\User::factory()->create(['name'=>'EC005 ${roleLabel}','email'=>'${account.email}','password'=>'${account.password}']);
    $user->profile()->create(['display_name'=>'EC005 ${roleLabel}','headline'=>'Professional ${roleLabel}','job_title'=>'Manager','bio'=>'Automated ${roleLabel} profile.','website'=>'https://example.test','linkedin_url'=>'https://www.linkedin.com/in/ec005-${suffix}','onboarding_completed_at'=>now()]);
    echo json_encode(['id'=>$user->id]);
  `;
  const output = execFileSync('php', ['artisan', 'tinker', '--execute', code], { cwd: resolve(process.cwd(), '../backend'), encoding: 'utf8' });
  const line = output.trim().split(/\r?\n/).reverse().find((value) => value.trim().startsWith('{'));
  if (!line) throw new Error(`Could not parse fixture output: ${output}`);
  const fixture = JSON.parse(line) as { id: number };
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.locator('#login-password').fill(account.password);
  const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  expect((await loginResponse).ok()).toBeTruthy();
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile$/);
  return { ...account, userId: fixture.id };
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
