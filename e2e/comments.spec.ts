import { expect, test } from '@playwright/test';

import { addMember, createBusiness, createTestUser } from './business/helpers';
import { createApiPost } from './feed/helpers';

async function createApiComment(page: import('@playwright/test').Page, postId: number, body: string): Promise<number> {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  return page.evaluate(async ({ apiBaseUrl, postId, body }) => {
    const xsrfCookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='));
    const response = await fetch(`${apiBaseUrl}/posts/${postId}/comments`, {
      method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.substring('XSRF-TOKEN='.length)) } : {}) },
      body: JSON.stringify({ author_type: 'user', body }),
    });
    if (!response.ok) throw new Error(`Comment fixture creation failed with ${response.status}.`);
    const payload = await response.json() as { data: { id: number } };
    return payload.data.id;
  }, { apiBaseUrl, postId, body });
}

async function createApiReply(page: import('@playwright/test').Page, commentId: number, body: string, businessId?: number): Promise<number> {
  const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:8000/api/v1';
  return page.evaluate(async ({ apiBaseUrl, commentId, body, businessId }) => {
    const xsrfCookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='));
    const response = await fetch(`${apiBaseUrl}/comments/${commentId}/replies`, {
      method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(xsrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.substring('XSRF-TOKEN='.length)) } : {}) },
      body: JSON.stringify(businessId ? { author_type: 'business', business_id: businessId, body } : { author_type: 'user', body }),
    });
    if (!response.ok) throw new Error(`Reply fixture creation failed with ${response.status}.`);
    const payload = await response.json() as { data: { id: number } };
    return payload.data.id;
  }, { apiBaseUrl, commentId, body, businessId });
}

test.describe('EC-008 comments and replies', () => {
  test.setTimeout(180_000);

  test('supports user and business comments, one-level replies, editing, and deletion', async ({ page, browser }) => {
    await createTestUser(page, 'comment-owner');
    const business = await createBusiness(page, 'Comment Publisher');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill(`Comment target ${Date.now()}`);
    const created = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const postId = ((await (await created).json()) as { data: { id: number } }).data.id;

    const editorContext = await browser.newContext();
    const editorPage = await editorContext.newPage();
    const editor = await createTestUser(editorPage, 'comment-editor');
    await addMember(page, business.slug, editor.userId, 'editor');
    await editorPage.goto('/my-posts');
    await expect(editorPage.locator('#post-author option', { hasText: business.name })).toHaveCount(1);
    await expect(editorPage.locator('#post-author option', { hasText: '(editor)' })).toHaveCount(1);
    const businessId = Number((await editorPage.locator('#post-author option', { hasText: business.name }).getAttribute('value'))?.split(':')[1]);

    await page.goto(`/posts/${postId}`);
    const comments = page.locator(`[data-post-comments="${postId}"]`);
    await expect(comments).toBeVisible();
    await comments.locator(`#comment-body-${postId}-top`).fill('A thoughtful user comment.');
    const userCommentResponse = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/comments`) && response.request().method() === 'POST');
    await comments.getByRole('button', { name: 'Comment', exact: true }).click();
    const userCommentId = ((await (await userCommentResponse).json()) as { data: { id: number } }).data.id;
    await expect(comments.getByText('A thoughtful user comment.')).toBeVisible();

    await editorPage.goto(`/posts/${postId}`);
    const editorComments = editorPage.locator(`[data-post-comments="${postId}"]`);
    await expect(editorComments).toBeVisible();
    await editorComments.locator(`#comment-author-${postId}-top`).selectOption({ label: `${business.name} (editor)` });
    await editorComments.locator(`#comment-body-${postId}-top`).fill('A business editor comment.');
    const businessCommentResponse = editorPage.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/comments`) && response.request().method() === 'POST');
    await editorComments.getByRole('button', { name: 'Comment', exact: true }).click();
    const businessResponse = await businessCommentResponse;
    expect(businessResponse.ok()).toBeTruthy();
    const businessCommentId = ((await businessResponse.json()) as { data: { id: number } }).data.id;
    await expect(editorComments.getByText('A business editor comment.')).toBeVisible();

    const userComment = editorComments.locator(`[data-comment-id="${userCommentId}"]`).first();
    await userComment.getByRole('button', { name: 'Reply', exact: true }).click();
    const replyId = await createApiReply(editorPage, userCommentId, 'A user reply.');
    const businessReplyId = await createApiReply(editorPage, businessCommentId, 'A business reply.', businessId);
    await editorPage.reload();
    const reply = editorComments.locator(`[data-comment-id="${replyId}"]`);
    await expect(reply).toBeVisible();
    await expect(reply.getByRole('button', { name: 'Reply', exact: true })).toHaveCount(0);
    await expect(editorComments.getByText('1 reply', { exact: true }).first()).toBeVisible();
    await expect(editorPage.locator(`[data-comment-id="${businessReplyId}"]`)).toContainText('A business reply.');

    await page.reload();
    const ownerComment = page.locator(`[data-comment-id="${userCommentId}"]`).first();
    await ownerComment.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel(`Edit comment`).fill('Edited user comment.');
    const update = page.waitForResponse((response) => response.url().endsWith(`/api/v1/comments/${userCommentId}`) && response.request().method() === 'PATCH');
    await ownerComment.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await update).ok()).toBeTruthy();
    await expect(page.getByText('Edited user comment.')).toBeVisible();

    await editorPage.reload();
    const replyAgain = editorPage.locator(`[data-comment-id="${replyId}"]`).first();
    await replyAgain.getByRole('button', { name: 'Delete', exact: true }).click();
    await editorPage.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(editorPage.locator(`[data-comment-id="${replyId}"]`)).toHaveCount(0);

    await page.reload();
    const topAgain = page.locator(`[data-comment-id="${userCommentId}"]`).first();
    await topAgain.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator(`[data-comment-id="${userCommentId}"]`)).toHaveCount(0);
    await page.reload();
    await expect(page.locator(`[data-comment-id="${userCommentId}"]`)).toHaveCount(0);
    await editorContext.close();
  });

  test('paginates comments and lazy-loads comments from the feed', async ({ page }) => {
    await createTestUser(page, 'comment-pagination');
    const postId = await createApiPost(page, `Comment pagination target ${Date.now()}`);
    for (let index = 1; index <= 21; index += 1) await createApiComment(page, postId, `Pagination comment ${index}`);

    await page.goto(`/posts/${postId}`);
    const comments = page.locator(`[data-post-comments="${postId}"]`);
    await expect(comments.locator('[data-comment-id]')).toHaveCount(20);
    const more = page.getByRole('button', { name: 'Load more comments', exact: true });
    const nextPage = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/comments?page=2`));
    await more.click();
    expect((await nextPage).ok()).toBeTruthy();
    await expect(comments.locator('[data-comment-id]')).toHaveCount(21);
    const ids = await comments.locator('[data-comment-id]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-comment-id')));
    expect(new Set(ids).size).toBe(ids.length);

    await page.goto('/');
    const card = page.locator(`[data-post-id="${postId}"]`);
    await expect(card).toBeVisible();
    await expect(card.locator('[data-post-comments]')).toHaveCount(0);
    const commentsRequest = page.waitForResponse((response) => response.url().endsWith(`/api/v1/posts/${postId}/comments?page=1`));
    await card.getByRole('button', { name: 'View comments', exact: true }).click();
    expect((await commentsRequest).ok()).toBeTruthy();
    await expect(card.locator('[data-post-comments]')).toBeVisible();
  });

  test('does not offer comments for draft management posts', async ({ page }) => {
    await createTestUser(page, 'comment-draft');
    await page.goto('/my-posts');
    await page.getByLabel('Post text').fill(`Draft without comments ${Date.now()}`);
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    const draft = page.getByText('Draft', { exact: true }).locator('..').locator('..');
    await expect(draft.getByRole('button', { name: 'View comments', exact: true })).toHaveCount(0);
  });
});
