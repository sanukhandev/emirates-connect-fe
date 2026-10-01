import { expect, test } from '@playwright/test';
import { addMember, createBusiness, credentials, currentUserId, loginAs } from './helpers';

test('enforces owner, admin, editor, and non-member management UX', async ({ browser }) => {
  const owner = credentials('owner');
  const admin = credentials('admin');
  const editor = credentials('editor');
  const nonMember = credentials('nonMember');
  test.skip(!owner || !admin || !editor || !nonMember, 'Set owner, admin, editor, and non-member credentials.');

  const ownerPage = await browser.newPage();
  await loginAs(ownerPage, owner!);
  const { slug } = await createBusiness(ownerPage, 'Permissions');
  const adminPage = await browser.newPage();
  await loginAs(adminPage, admin!);
  const adminId = await currentUserId(adminPage);
  const editorPage = await browser.newPage();
  await loginAs(editorPage, editor!);
  const editorId = await currentUserId(editorPage);
  await addMember(ownerPage, slug, adminId, 'admin');
  await addMember(ownerPage, slug, editorId, 'editor');

  await ownerPage.goto(`/businesses/${slug}`);
  await expect(ownerPage.getByRole('link', { name: 'Edit Business' })).toBeVisible();
  await expect(ownerPage.getByRole('link', { name: 'Manage Members' })).toBeVisible();
  await expect(ownerPage.getByRole('button', { name: 'Deactivate Business' })).toBeVisible();

  await adminPage.goto(`/businesses/${slug}`);
  await expect(adminPage.getByRole('link', { name: 'Edit Business' })).toBeVisible();
  await expect(adminPage.getByRole('link', { name: 'Manage Members' })).toBeVisible();
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

  const outsiderPage = await browser.newPage();
  await loginAs(outsiderPage, nonMember!);
  await outsiderPage.goto(`/businesses/${slug}`);
  await expect(outsiderPage.getByRole('link', { name: 'Edit Business' })).toHaveCount(0);
  await expect(outsiderPage.getByRole('link', { name: 'Manage Members' })).toHaveCount(0);
  await outsiderPage.goto(`/businesses/${slug}/edit`);
  await expect(outsiderPage.getByRole('heading', { name: 'Management unavailable' })).toBeVisible();
  await outsiderPage.goto(`/businesses/${slug}/members`);
  await expect(outsiderPage.getByRole('heading', { name: 'Management unavailable' })).toBeVisible();
  await Promise.all([ownerPage.close(), adminPage.close(), editorPage.close(), outsiderPage.close()]);
});
