import { expect, test } from '@playwright/test';
import { addMember, createBusiness, createTestUser } from './helpers';

test('owner manages members, roles, duplicates, and owner protection', async ({ page, browser }) => {
  test.setTimeout(180_000);
  await createTestUser(page, 'owner-members-owner');
  const adminPage = await browser.newPage();
  const editorPage = await browser.newPage();
  const admin = await createTestUser(adminPage, 'owner-members-admin');
  const editor = await createTestUser(editorPage, 'owner-members-editor');
  const { slug } = await createBusiness(page, 'Owner Members');
  await addMember(page, slug, admin.userId, 'admin');
  await addMember(page, slug, editor.userId, 'editor');
  await expect(page.getByText('owner', { exact: true })).toBeVisible();
  await expect(page.getByText('admin', { exact: true })).toBeVisible();
  await expect(page.getByText('editor', { exact: true })).toBeVisible();
  await expect(page.locator(`input#member-user-id`)).toBeVisible();
  await expect(page.locator('article').filter({ hasText: 'EC005 owner-members-owner' }).locator('select')).toHaveCount(0);

  await page.locator('#member-user-id').fill(String(editor.userId));
  await page.locator('#member-role').selectOption('editor');
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  await expect(page.getByText('Please check the highlighted fields.')).toBeVisible();

  const adminRow = page.locator('article').filter({ hasText: 'EC005 owner-members-admin' });
  const adminRoleChange = Promise.all([
    page.waitForResponse((response) => response.url().includes('/members/') && response.request().method() === 'PATCH' && response.ok()),
    page.waitForResponse((response) => response.url().includes('/members') && response.request().method() === 'GET' && response.ok()),
  ]);
  await adminRow.getByRole('combobox').selectOption('editor');
  await adminRoleChange;
  await expect(page.getByText('editor', { exact: true })).toHaveCount(2);
  const editorRow = page.locator('article').filter({ hasText: 'EC005 owner-members-editor' });
  const editorRoleChange = Promise.all([
    page.waitForResponse((response) => response.url().includes('/members/') && response.request().method() === 'PATCH' && response.ok()),
    page.waitForResponse((response) => response.url().includes('/members') && response.request().method() === 'GET' && response.ok()),
  ]);
  await editorRow.getByRole('combobox').selectOption('admin');
  await editorRoleChange;
  await expect(adminRow.getByText('editor', { exact: true })).toBeVisible();
  await expect(editorRow.getByText('admin', { exact: true })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: 'EC005 owner-members-owner' }).locator('select')).toHaveCount(0);
  await adminPage.close();
  await editorPage.close();
});
