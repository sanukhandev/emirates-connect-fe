import { HttpInterceptorFn } from '@angular/common/http';

import { isTrustedBackendUrl } from './backend-origin';

export const credentialsInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isTrustedBackendUrl(request.url)) {
    return next(request);
  }

  return next(request.clone({ withCredentials: true }));
};
