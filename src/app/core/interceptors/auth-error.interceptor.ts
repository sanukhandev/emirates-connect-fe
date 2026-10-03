import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { csrfRetried } from './xsrf.interceptor';

export const authErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const state = injectState();

  return next(request).pipe(
    catchError((error: { status?: number }) => {
      if (error.status === 401) {
        state.clear();
      }

      if (error.status !== 419 || request.context.get(csrfRetried) || !request.url.startsWith(environment.apiBaseUrl) || !isSafeRetryMethod(request.method)) {
        return throwError(() => error);
      }

      const csrfRequest = request.clone({
        method: 'GET',
        url: `${environment.backendOrigin}/sanctum/csrf-cookie`,
        body: null,
        withCredentials: true,
        context: request.context.set(csrfRetried, true),
      });

      return next(csrfRequest).pipe(
        switchMap(() => next(request.clone({ context: request.context.set(csrfRetried, true) }))),
      );
    }),
  );
};

function isSafeRetryMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

function injectState(): AuthStateService {
  return inject(AuthStateService);
}
