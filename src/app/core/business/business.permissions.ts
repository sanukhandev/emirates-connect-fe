import { BusinessRole } from './business.models';

export function canEditBusiness(role: BusinessRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageAdmins(role: BusinessRole | null): boolean {
  return role === 'owner';
}

export function canManageEditors(role: BusinessRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function canDeactivateBusiness(role: BusinessRole | null): boolean {
  return role === 'owner';
}

export function memberRoleOptions(role: BusinessRole | null): Array<'admin' | 'editor'> {
  return role === 'owner' ? ['admin', 'editor'] : role === 'admin' ? ['editor'] : [];
}
