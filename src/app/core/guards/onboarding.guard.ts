import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../auth/auth.service';

export const onboardingGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.initialize().pipe(
    map(() => {
      if (!auth.isAuthenticated()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      return auth.currentUser()?.profile?.onboarding_completed !== true
        ? router.createUrlTree(['/onboarding'])
        : true;
    }),
  );
};

export const onboardingPageGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.initialize().pipe(
    map(() => auth.currentUser()?.profile?.onboarding_completed === true ? router.createUrlTree(['/profile']) : true),
  );
};
