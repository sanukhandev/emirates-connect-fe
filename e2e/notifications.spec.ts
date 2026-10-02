import { expect, test } from '@playwright/test';

import { createTestUser } from './business/helpers';

test.describe('EC-014 notifications', () => {
  test.setTimeout(180_000);

  test('shows a real follow notification, unread badge, read state, and mark-all', async ({ page, browser }) => {
    const actor = await createTestUser(page, 'notification-actor');
    const targetContext = await browser.newContext();
    const targetPage = await targetContext.newPage();
    const target = await createTestUser(targetPage, 'notification-target');
    const secondActorContext = await browser.newContext();
    const secondActorPage = await secondActorContext.newPage();
    await createTestUser(secondActorPage, 'notification-second-actor');

    await page.goto(`/users/${target.userId}`);
    await page.getByRole('button', { name: 'Follow' }).click();
    await expect(page.getByRole('button', { name: /Unfollow/ })).toBeVisible();
    await secondActorPage.goto(`/users/${target.userId}`);
    await secondActorPage.getByRole('button', { name: 'Follow' }).click();

    await targetPage.goto('/');
    await expect(targetPage.getByRole('link', { name: /Notifications, 2 unread/ })).toBeVisible();
    await targetPage.goto('/notifications');
    const followRow = targetPage.getByRole('button', { name: /EC005 notification-actor followed you/ });
    await expect(followRow).toBeVisible();
    await followRow.click();
    await expect(targetPage).toHaveURL(new RegExp(`/users/${actor.userId}$`));

    await targetPage.goBack();
    await expect(targetPage).toHaveURL(/\/notifications/);
    await targetPage.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(targetPage.getByRole('button', { name: 'Mark all as read' })).toHaveCount(0);
    await expect(targetPage.getByRole('link', { name: 'Notifications' })).toBeVisible();
    await secondActorContext.close();
    await targetContext.close();
  });

  test('shows a real post comment notification and renders it safely', async ({ page, browser }) => {
    const owner = await createTestUser(page, 'notification-owner');
    const commenterContext = await browser.newContext();
    const commenterPage = await commenterContext.newPage();
    await createTestUser(commenterPage, 'notification-commenter');

    await page.goto('/');
    await page.getByLabel('Post text Optional when images are attached').fill(`EC014 notification post ${Date.now()}`);
    const postResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/posts') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const post = await (await postResponse).json() as { data: { id: number } };

    await commenterPage.goto(`/posts/${post.data.id}`);
    await commenterPage.locator('textarea').first().fill('EC014 notification comment');
    await commenterPage.getByRole('button', { name: 'Comment', exact: true }).click();
    await expect(commenterPage.getByText('EC014 notification comment')).toBeVisible();

    await page.goto('/notifications');
    await expect(page.getByRole('button', { name: /commented on your post/ })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('email');
    await commenterContext.close();
    expect(owner.userId).toBeGreaterThan(0);
  });

  test('protects the notification route for guests and remains responsive', async ({ browser }) => {
    const context = await browser.newContext();
    const guest = await context.newPage();
    await guest.goto('/notifications');
    await expect(guest).toHaveURL(/\/login(?:\?.*)?$/);
    for (const width of [320, 375, 768, 1024]) {
      await guest.setViewportSize({ width, height: 900 });
      expect(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await context.close();
  });
});
