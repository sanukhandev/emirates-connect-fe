import { Page } from '@playwright/test';

import { createBusiness, createTestUser, ProvisionedUser } from '../business/helpers';

export { createBusiness };
export { createTestUser };
export type { ProvisionedUser };

export async function createApiPost(page: Page, body: string): Promise<number> {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  return page.evaluate(async ({ apiBaseUrl, body }) => {
    const xsrfCookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='));
    const response = await fetch(`${apiBaseUrl}/posts`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.substring('XSRF-TOKEN='.length)) } : {}),
      },
      body: JSON.stringify({ author_type: 'user', body, status: 'published' }),
    });
    if (!response.ok) throw new Error(`Post fixture creation failed with ${response.status}.`);
    const payload = await response.json() as { data: { id: number } };
    return payload.data.id;
  }, { apiBaseUrl, body });
}
