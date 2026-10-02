import { expect, test } from '@playwright/test';

import { createBusiness, createTestUser } from './business/helpers';

test.describe('EC-010 follows', () => {
  test.setTimeout(180_000);

  test('follows and unfollows a user with persisted counts', async ({ page, browser }) => {
    const actor = await createTestUser(page, 'follow-actor');
    const targetContext = await browser.newContext();
    const targetPage = await targetContext.newPage();
    const target = await createTestUser(targetPage, 'follow-target');

    await page.goto('/users/' + target.userId);
    const control = page.locator('app-follow-control');
    await expect(control.getByRole('button')).toHaveText('Follow');
    const follow = page.waitForResponse((response) => response.url().endsWith('/api/v1/users/' + target.userId + '/follow') && response.request().method() === 'PUT');
    await control.getByRole('button').click();
    expect((await follow).ok()).toBeTruthy();
    await expect(control.getByRole('button')).toHaveText('Following');
    await expect(page.getByText('1 followers', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.locator('app-follow-control button')).toHaveText('Following');
    const unfollow = page.waitForResponse((response) => response.url().endsWith('/api/v1/users/' + target.userId + '/follow') && response.request().method() === 'DELETE');
    await page.locator('app-follow-control button').click();
    expect((await unfollow).status()).toBe(204);
    await expect(page.locator('app-follow-control button')).toHaveText('Follow');
    await targetContext.close();
    expect(actor.userId).toBeGreaterThan(0);
  });

  test('omits self-follow and preserves directionality', async ({ page, browser }) => {
    const first = await createTestUser(page, 'follow-first');
    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    const second = await createTestUser(secondPage, 'follow-second');

    await page.goto('/users/' + first.userId);
    await expect(page.locator('app-follow-control')).toHaveCount(0);
    await page.goto('/users/' + second.userId);
    await page.locator('app-follow-control button').click();
    await expect(page.locator('app-follow-control button')).toHaveText('Following');

    await secondPage.goto('/users/' + first.userId);
    await expect(secondPage.locator('app-follow-control button')).toHaveText('Follow');
    await secondContext.close();
  });

  test('follows a business as the human user and renders mixed network lists', async ({ page, browser }) => {
    const actor = await createTestUser(page, 'follow-business-actor');
    const business = await createBusiness(page, 'Follow Target');
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    const other = await createTestUser(otherPage, 'follow-business-other');

    await page.goto('/businesses/' + business.slug);
    await page.locator('app-follow-control button').click();
    await expect(page.locator('app-follow-control button')).toHaveText('Following');
    await expect(page.getByText('1 followers', { exact: true })).toBeVisible();

    await page.goto('/users/' + actor.userId + '/following');
    await expect(page.getByText(business.name, { exact: true })).toBeVisible();
    await expect(page.getByText('Business', { exact: true })).toBeVisible();

    await otherPage.goto('/businesses/' + business.slug);
    await otherPage.locator('app-follow-control button').click();
    await otherPage.goto('/businesses/' + business.slug + '/followers');
    await expect(otherPage.getByText('EC005 follow-business-other', { exact: false })).toBeVisible();
    await otherContext.close();
    expect(other.userId).toBeGreaterThan(0);
  });

  test('rolls back an optimistic follow failure and sends guests to login', async ({ page, browser }) => {
    const owner = await createTestUser(page, 'follow-rollback-owner');
    const targetContext = await browser.newContext();
    const targetPage = await targetContext.newPage();
    const target = await createTestUser(targetPage, 'follow-rollback-target');

    await page.goto('/users/' + target.userId);
    await page.route('**/api/v1/users/' + target.userId + '/follow', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await route.fulfill({ status: 500, body: JSON.stringify({ message: 'failed' }) });
    });
    await page.locator('app-follow-control button').click();
    await expect(page.locator('app-follow-control button')).toHaveText('Following');
    await expect(page.getByText('Couldn’t update follow status. Try again.', { exact: true })).toBeVisible();
    await expect(page.locator('app-follow-control button')).toHaveText('Follow');

    const guestContext = await browser.newContext();
    const guest = await guestContext.newPage();
    let mutationCalled = false;
    await guest.route('**/api/v1/users/*/follow', async (route) => { mutationCalled = true; await route.continue(); });
    await guest.goto('/users/' + target.userId);
    await guest.locator('app-follow-control button').click();
    expect(mutationCalled).toBe(false);
    await expect(guest).toHaveURL(/\/login$/);
    await guestContext.close();
    await targetContext.close();
    expect(owner.userId).toBeGreaterThan(0);
  });

  test('loads user followers, following, and business followers routes', async ({ page, browser }) => {
    const actor = await createTestUser(page, 'network-actor');
    const targetContext = await browser.newContext();
    const targetPage = await targetContext.newPage();
    const target = await createTestUser(targetPage, 'network-target');
    const business = await createBusiness(page, 'Network Target');

    await page.goto('/users/' + target.userId);
    await page.locator('app-follow-control button').click();
    await page.goto('/users/' + target.userId + '/followers');
    await expect(page.getByText('EC005 network-actor', { exact: false })).toBeVisible();

    await page.goto('/users/' + actor.userId + '/following');
    await expect(page.getByText('EC005 network-target', { exact: false })).toBeVisible();
    await page.goto('/businesses/' + business.slug);
    await page.locator('app-follow-control button').click();
    await page.goto('/businesses/' + business.slug + '/followers');
    await expect(page.getByText('EC005 network-actor', { exact: false })).toBeVisible();
    await targetContext.close();
  });
});
