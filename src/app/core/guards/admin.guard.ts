import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AdminService } from '../admin/admin.service';
import { AuthService } from '../auth/auth.service';

export const adminGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const admin = inject(AdminService);
  const router = inject(Router);
  return auth.initialize().pipe(switchMap(() => switchAdmin(auth.isAuthenticated(), state.url, router, admin)));
};

function switchAdmin(authenticated: boolean, url: string, router: Router, admin: AdminService) {
  if (!authenticated) return of(router.createUrlTree(['/login'], { queryParams: { returnUrl: url } }));
  return admin.dashboard().pipe(map(() => true), catchError((error: { status?: number }) => of(router.createUrlTree(error.status === 401 ? ['/login'] : ['/forbidden']))));
}
