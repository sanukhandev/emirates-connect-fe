import { describe, expect, it } from 'vitest';

import { canDeactivateBusiness, canEditBusiness, canManageAdmins, canManageEditors, memberRoleOptions } from './business.permissions';

describe('business permissions', () => {
  it('keeps the role matrix centralized', () => {
    expect(canEditBusiness('owner')).toBe(true);
    expect(canEditBusiness('admin')).toBe(true);
    expect(canEditBusiness('editor')).toBe(false);
    expect(canEditBusiness(null)).toBe(false);
    expect(canManageAdmins('owner')).toBe(true);
    expect(canManageAdmins('admin')).toBe(false);
    expect(canManageEditors('owner')).toBe(true);
    expect(canManageEditors('admin')).toBe(true);
    expect(canManageEditors('editor')).toBe(false);
    expect(canDeactivateBusiness('owner')).toBe(true);
    expect(canDeactivateBusiness('admin')).toBe(false);
  });

  it('only offers roles the current manager can assign', () => {
    expect(memberRoleOptions('owner')).toEqual(['admin', 'editor']);
    expect(memberRoleOptions('admin')).toEqual(['editor']);
    expect(memberRoleOptions('editor')).toEqual([]);
    expect(memberRoleOptions(null)).toEqual([]);
  });
});
