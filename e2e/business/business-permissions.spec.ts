import { expect, test } from '@playwright/test';
import { addMember, createBusiness, createTestUser } from './helpers';

test('enforces owner, admin, editor, and non-member management UX', async ({ browser }) => {
  test.setTimeout(180_000);
  const ownerPage = await browser.newPage();
  await createTestUser(ownerPage, 'permissions-owner');
  const { slug } = await createBusiness(ownerPage, 'Permissions');
  const adminPage = await browser.newPage();
  const admin = await createTestUser(adminPage, 'permissions-admin');
  const editorPage = await browser.newPage();
  const editor = await createTestUser(editorPage, 'permissions-editor');
  const outsiderPage = await browser.newPage();
  await createTestUser(outsiderPage, 'permissions-nonmember');
  const editorTwoPage = await browser.newPage();
  const editorTwo = await createTestUser(editorTwoPage, 'permissions-editor-two');
  await addMember(ownerPage, slug, admin.userId, 'admin');
  await addMember(ownerPage, slug, editor.userId, 'editor');

  await ownerPage.goto(`/businesses/${slug}`);
  await expect(ownerPage.getByRole('link', { name: 'Edit Business' })).toBeVisible();
  await expect(ownerPage.getByRole('link', { name: 'Manage Members' })).toBeVisible();
  await ownerPage.goto(`/businesses/${slug}/edit`);
  await expect(ownerPage.getByRole('button', { name: 'Deactivate Business' })).toBeVisible();

  await adminPage.goto(`/businesses/${slug}`);
  await expect(adminPage.getByRole('link', { name: 'Edit Business' })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Manage Members' })).toBeVisible();
  await adminPage.goto(`/businesses/${slug}/edit`);
  await expect(adminPage.getByRole('button', { name: 'Deactivate Business' })).toHaveCount(0);
  await adminPage.goto(`/businesses/${slug}/members`);
  await expect(adminPage.locator('#member-role option')).toHaveCount(1);

  await editorPage.goto(`/businesses/${slug}`);
  await expect(editorPage.getByRole('heading', { name: 'EC005 Permissions' })).toBeVisible();
  await expect(editorPage.getByRole('link', { name: 'Edit Business' })).toHaveCount(0);
  await expect(editorPage.getByRole('link', { name: 'Manage Members' })).toHaveCount(0);
  await editorPage.goto(`/businesses/${slug}/edit`);
  await expect(editorPage.getByRole('heading', { name: 'Management unavailable' })).toBeVisible();
  await editorPage.goto(`/businesses/${slug}/members`);
  await expect(editorPage.getByRole('heading', { name: 'Management unavailable' })).toBeVisible();

  await outsiderPage.goto(`/businesses/${slug}`);
  await expect(outsiderPage.getByRole('link', { name: 'Edit Business' })).toHaveCount(0);
  await expect(outsiderPage.getByRole('link', { name: 'Manage Members' })).toHaveCount(0);
  await outsiderPage.goto(`/businesses/${slug}/edit`);
  await expect(outsiderPage.getByRole('heading', { name: 'Management unavailable' })).toBeVisible();
  await outsiderPage.goto(`/businesses/${slug}/members`);
  await expect(outsiderPage.getByRole('heading', { name: 'Management unavailable' })).toBeVisible();
  await addMember(adminPage, slug, editorTwo.userId, 'editor');
  await expect(adminPage.getByText('Member added.')).toBeVisible();
  await Promise.all([ownerPage.close(), adminPage.close(), editorPage.close(), outsiderPage.close(), editorTwoPage.close()]);
});
