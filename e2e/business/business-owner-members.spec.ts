import { expect, test } from '@playwright/test';
import { addMember, createBusiness, credentials, currentUserId, loginAs } from './helpers';

test('owner manages members, roles, duplicates, and owner protection', async ({ page }) => {
  const owner = credentials('owner');
  const adminId = Number(process.env['E2E_ADMIN_USER_ID']);
  const editorId = Number(process.env['E2E_EDITOR_USER_ID']);
  test.skip(!owner || !adminId || !editorId, 'Set owner credentials and member user IDs.');
  await loginAs(page, owner!);
  const { slug } = await createBusiness(page, 'Owner Members');
  const ownerId = await currentUserId(page);
  await addMember(page, slug, adminId, 'admin');
  await addMember(page, slug, editorId, 'editor');
  await expect(page.getByText('Owner')).toBeVisible();
  await expect(page.getByText('Admin')).toBeVisible();
  await expect(page.getByText('Editor')).toBeVisible();
  await expect(page.locator(`input#member-user-id`)).toBeVisible();
  await expect(page.locator(`article`).filter({ hasText: 'Owner' }).locator('select')).toHaveCount(0);

  await page.locator('#member-user-id').fill(String(editorId));
  await page.locator('#member-role').selectOption('editor');
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  await expect(page.getByText('Please check the highlighted fields.')).toBeVisible();

  const adminRow = page.locator('article').filter({ hasText: 'Admin' }).first();
  await adminRow.getByRole('combobox').selectOption('editor');
  await expect(page.getByText('Editor')).toHaveCount(2);
  const editorRow = page.locator('article').filter({ hasText: 'Editor' }).first();
  await editorRow.getByRole('combobox').selectOption('admin');
  await expect(page.getByText('Admin')).toHaveCount(2);
  await expect(page.locator(`article`).filter({ hasText: String(ownerId) })).toHaveCount(0);
});
