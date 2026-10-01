import { expect, test } from '@playwright/test';

import { addMember, createBusiness, createTestUser } from './business/helpers';

test.describe('EC-006 posts', () => {
  test.setTimeout(120_000);

  test('creates a published user text post', async ({ page }) => {
    await createTestUser(page, 'post-author');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('A real user-authored Emirates Connect update.');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(page.getByText('A real user-authored Emirates Connect update.')).toBeVisible();
  });

  test('creates an image post through the real file input', async ({ page }) => {
    await createTestUser(page, 'image-author');
    await page.goto('/my-posts');
    await page.locator('#post-images').setInputFiles({ name: 'post.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(page.getByAltText('Post image 1')).toBeVisible();
  });

  test('saves a draft and shows the draft management state', async ({ page }) => {
    await createTestUser(page, 'draft-author');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('A private draft for later.');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  });

  test('publishes as a managed business identity', async ({ page }) => {
    await createTestUser(page, 'business-author');
    const business = await createBusiness(page, 'Post Publisher');
    await page.goto('/my-posts');
    await page.locator('#post-author').selectOption({ label: `${business.name} (owner)` });
    await page.getByLabel('Post text').fill('An update published by the business.');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await page.goto(`/businesses/${business.slug}`);
    await expect(page.getByText('An update published by the business.')).toBeVisible();
  });

  test('publishes a draft through the edit page', async ({ page }) => {
    await createTestUser(page, 'draft-publisher');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('Draft that becomes public.');
    const created = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    expect((await created).ok()).toBeTruthy();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page).toHaveURL(/\/posts\/\d+\/edit$/);
    await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('draft');
    await page.getByRole('combobox', { name: 'Status' }).selectOption('published');
    const published = page.waitForResponse((candidate) => /\/api\/v1\/posts\/\d+$/.test(candidate.url()) && candidate.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    expect((await published).ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/posts\/\d+$/);
    await expect(page.getByText('Draft that becomes public.')).toBeVisible();
  });

  test('lets a business editor select and publish as the business', async ({ page, browser }) => {
    await createTestUser(page, 'editor-owner');
    const business = await createBusiness(page, 'Editor Publisher');
    const editorContext = await browser.newContext();
    const editorPage = await editorContext.newPage();
    const editor = await createTestUser(editorPage, 'editor-publisher');
    await addMember(page, business.slug, editor.userId, 'editor');
    await editorPage.goto('/my-posts');
    await expect(editorPage.locator('#post-author option', { hasText: business.name })).toHaveCount(1);
    await editorPage.locator('#post-author').selectOption({ label: `${business.name} (editor)` });
    await editorPage.getByLabel('Post text').fill('Published by the business editor.');
    const response = editorPage.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await editorPage.getByRole('button', { name: 'Publish', exact: true }).click();
    expect((await response).ok()).toBeTruthy();
    await editorPage.goto(`/businesses/${business.slug}`);
    await expect(editorPage.getByText('Business', { exact: true })).toBeVisible();
    await expect(editorPage.getByText('Published by the business editor.')).toBeVisible();
    await editorContext.close();
  });

  test('edits a post without exposing author switching', async ({ page }) => {
    await createTestUser(page, 'post-editor');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('Before editing.');
    const created = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const createResponse = await created;
    const postId = (await createResponse.json() as { data: { id: number } }).data.id;
    await page.goto(`/posts/${postId}/edit`);
    await expect(page.getByText(/Author:/)).toBeVisible();
    await expect(page.locator('select')).toHaveCount(1);
    await expect(page.locator('select').first()).toHaveAttribute('id', 'edit-post-status');
    await page.getByLabel('Post text').fill('After editing.');
    const updated = page.waitForResponse((candidate) => candidate.url().endsWith(`/api/v1/posts/${postId}`) && candidate.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    expect((await updated).ok()).toBeTruthy();
    await expect(page.getByText('After editing.')).toBeVisible();
    await page.reload();
    await expect(page.getByText('After editing.')).toBeVisible();
  });

  test('adds and deletes post media with persistence', async ({ page }) => {
    await createTestUser(page, 'media-editor');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('Media lifecycle post.');
    const created = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const postId = ((await (await created).json()) as { data: { id: number } }).data.id;
    await page.goto(`/posts/${postId}/edit`);
    await page.locator('#add-post-media').setInputFiles({ name: 'added.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
    const added = page.waitForResponse((candidate) => candidate.url().endsWith(`/api/v1/posts/${postId}/media`) && candidate.request().method() === 'POST');
    expect((await added).ok()).toBeTruthy();
    await expect(page.getByAltText('Post image 1')).toBeVisible();
    await page.reload();
    await expect(page.getByAltText('Post image 1')).toBeVisible();
    const deleted = page.waitForResponse((candidate) => candidate.url().includes(`/api/v1/posts/${postId}/media/`) && candidate.request().method() === 'DELETE');
    await page.getByRole('button', { name: 'Remove image', exact: true }).click();
    expect((await deleted).ok()).toBeTruthy();
    await page.reload();
    await expect(page.getByAltText('Post image 1')).toHaveCount(0);
  });

  test('deletes a post after canceling its confirmation', async ({ page }) => {
    await createTestUser(page, 'post-deleter');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('Disposable post.');
    const created = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/posts') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const postId = ((await (await created).json()) as { data: { id: number } }).data.id;
    await page.getByRole('article').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.getByText('Disposable post.')).toBeVisible();
    await page.getByRole('article').getByRole('button', { name: 'Delete', exact: true }).click();
    const deleted = page.waitForResponse((candidate) => candidate.url().endsWith(`/api/v1/posts/${postId}`) && candidate.request().method() === 'DELETE');
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    expect((await deleted).status()).toBe(204);
    await expect(page.getByText('Disposable post.')).toHaveCount(0);
    await page.goto(`/posts/${postId}`);
    await expect(page.getByRole('heading', { name: 'Post not found' })).toBeVisible();
  });

  test('renders published user posts and hides drafts on the public profile', async ({ page }) => {
    const user = await createTestUser(page, 'public-posts');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill('Public profile post.');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByLabel('Post text').fill('Private profile draft.');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await page.goto(`/users/${user.userId}`);
    await expect(page.getByText('Public profile post.')).toBeVisible();
    await expect(page.getByText('Private profile draft.')).toHaveCount(0);
  });
});
