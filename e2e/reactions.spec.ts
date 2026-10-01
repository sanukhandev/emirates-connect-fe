import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './business/helpers';

const createPost = async (page: import('@playwright/test').Page, body: string, status: 'published' | 'draft' = 'published'): Promise<number> => {
  await page.goto('/my-posts');
  await page.getByLabel('Post text').fill(body);
  const created = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
  await page.getByRole('button', { name: status === 'published' ? 'Publish' : 'Save draft', exact: true }).click();
  const response = await created;
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { data: { id: number } }).data.id;
};

test.describe('EC-009 reactions', () => {
  test.setTimeout(120_000);

  test('adds, switches, and removes a post reaction with persistence', async ({ page }) => {
    await createTestUser(page, 'reaction-post');
    const postId = await createPost(page, 'Reaction lifecycle post.');
    await page.goto(`/posts/${postId}`);

    await expect(page.getByRole('button', { name: 'Like', exact: true })).toBeVisible();
    const add = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/reaction`) && response.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Like', exact: true }).click();
    expect((await add).ok()).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Remove Like reaction', exact: true })).toBeVisible();
    await expect(page.getByText('1 reaction', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Choose reaction', exact: true }).click();
    const switchRequest = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/reaction`) && response.request().method() === 'PUT');
    await page.getByRole('menuitem', { name: 'React with Celebrate', exact: true }).click();
    expect((await switchRequest).ok()).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Remove Celebrate reaction', exact: true })).toBeVisible();
    await expect(page.getByText('1 reaction', { exact: true })).toBeVisible();

    const remove = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/reaction`) && response.request().method() === 'DELETE');
    await page.getByRole('button', { name: 'Remove Celebrate reaction', exact: true }).click();
    expect((await remove).status()).toBe(204);
    await expect(page.getByText('1 reaction', { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Like', exact: true })).toBeVisible();
  });

  test('reacts to a top-level comment and a reply', async ({ page }) => {
    await createTestUser(page, 'reaction-comments');
    const postId = await createPost(page, 'Comment reaction target.');
    await page.goto(`/posts/${postId}`);
    await page.locator('textarea[formcontrolname="body"]').first().fill('Top-level reaction target.');
    const commentResponse = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/comments`) && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Comment', exact: true }).click();
    expect((await commentResponse).ok()).toBeTruthy();
    const comment = page.getByRole('article').filter({ hasText: 'Top-level reaction target.' });
    await comment.getByRole('button', { name: 'Like', exact: true }).click();
    await expect(comment.getByRole('button', { name: 'Remove Like reaction', exact: true })).toBeVisible();

    await comment.getByRole('button', { name: 'Reply', exact: true }).click();
    const replyForm = page.locator('form').filter({ hasText: 'Replying to' });
    await replyForm.locator('textarea[formcontrolname="body"]').fill('Reply reaction target.');
    const replyResponse = page.waitForResponse((response) => response.url().includes('/api/v1/comments/') && response.url().endsWith('/replies') && response.request().method() === 'POST');
    await replyForm.getByRole('button', { name: 'Reply', exact: true }).click();
    expect((await replyResponse).ok()).toBeTruthy();
    const reply = page.getByRole('article').filter({ hasText: 'Reply reaction target.' });
    await reply.getByRole('button', { name: 'Like', exact: true }).click();
    await expect(reply.getByRole('button', { name: 'Remove Like reaction', exact: true })).toBeVisible();
    await expect(reply.getByRole('button', { name: 'Reply', exact: true })).toHaveCount(0);
  });

  test('rolls back a failed reaction and keeps draft controls absent', async ({ page }) => {
    await createTestUser(page, 'reaction-rollback');
    const postId = await createPost(page, 'Rollback target.');
    await page.goto(`/posts/${postId}`);
    await page.route(`**/api/v1/posts/${postId}/reaction`, async (route) => { await new Promise((resolve) => setTimeout(resolve, 200)); await route.fulfill({ status: 500, body: JSON.stringify({ message: 'failed' }) }); });
    await page.getByRole('button', { name: 'Like', exact: true }).click();
    await expect(page.getByText('1 reaction', { exact: true })).toBeVisible();
    await expect(page.getByText('Couldn’t update reaction. Try again.', { exact: true })).toBeVisible();
    await expect(page.getByText('1 reaction', { exact: true })).toHaveCount(0);

    await createPost(page, 'Draft reaction target.', 'draft');
    const draftCard = page.getByRole('article').filter({ hasText: 'Draft reaction target.' });
    await expect(draftCard.getByText('Draft', { exact: true })).toBeVisible();
    await expect(draftCard.getByRole('button', { name: /reaction/i })).toHaveCount(0);
  });

  test('shows public counts but sends guests to login instead of mutating', async ({ page, browser }) => {
    await createTestUser(page, 'reaction-owner');
    const postId = await createPost(page, 'Guest reaction target.');
    const guestContext = await browser.newContext();
    const guest = await guestContext.newPage();
    let mutationCalled = false;
    await guest.route('**/api/v1/posts/*/reaction', async (route) => { mutationCalled = true; await route.continue(); });
    await guest.goto(`/posts/${postId}`);
    await expect(guest.getByRole('button', { name: 'Sign in to react', exact: true })).toBeVisible();
    await guest.getByRole('button', { name: 'Sign in to react', exact: true }).click();
    expect(mutationCalled).toBe(false);
    await expect(guest).toHaveURL(/\/login$/);
    await guestContext.close();
  });

  test('reacts to a business-authored post as a human user', async ({ page }) => {
    await createTestUser(page, 'reaction-business');
    const business = await createBusiness(page, 'Reaction Target');
    await page.goto('/my-posts');
    await page.locator('#post-author').selectOption({ label: `${business.name} (owner)` });
    await page.getByLabel('Post text').fill('Business reaction target.');
    const created = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const postId = ((await (await created).json()) as { data: { id: number } }).data.id;
    await page.goto(`/businesses/${business.slug}`);
    const card = page.getByRole('article').filter({ hasText: 'Business reaction target.' });
    const reaction = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/reaction`) && response.request().method() === 'PUT');
    await card.getByRole('button', { name: 'Like', exact: true }).click();
    expect((await reaction).ok()).toBeTruthy();
    await expect(card.getByRole('button', { name: 'Remove Like reaction', exact: true })).toBeVisible();
  });

  test('keeps reaction counts global but current selection isolated per user', async ({ page, browser }) => {
    await createTestUser(page, 'reaction-user-a');
    const postId = await createPost(page, 'Multi-user reaction target.');
    await page.goto(`/posts/${postId}`);
    await page.getByRole('button', { name: 'Like', exact: true }).click();
    await expect(page.getByText('1 reaction', { exact: true })).toBeVisible();

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await createTestUser(secondPage, 'reaction-user-b');
    await secondPage.goto(`/posts/${postId}`);
    await secondPage.getByRole('button', { name: 'Choose reaction', exact: true }).click();
    await secondPage.getByRole('menuitem', { name: 'React with Support', exact: true }).click();
    await expect(secondPage.getByText('2 reactions', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Remove Like reaction', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove Support reaction', exact: true })).toHaveCount(0);
    await expect(page.getByText('2 reactions', { exact: true })).toBeVisible();
    await secondContext.close();
  });

  test('updates a reaction directly from the chronological home feed', async ({ page }) => {
    await createTestUser(page, 'reaction-feed');
    await createPost(page, 'Feed reaction target.');
    await page.goto('/');
    const card = page.getByRole('article').filter({ hasText: 'Feed reaction target.' });
    await expect(card.getByRole('button', { name: 'Like', exact: true })).toBeVisible();
    await card.getByRole('button', { name: 'Like', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Remove Like reaction', exact: true })).toBeVisible();
    await expect(card.getByText('Feed reaction target.')).toBeVisible();
  });
});
