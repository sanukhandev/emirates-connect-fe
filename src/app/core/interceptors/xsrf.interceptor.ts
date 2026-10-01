import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';

import { isTrustedBackendUrl } from './backend-origin';

export const csrfRetried = new HttpContextToken<boolean>(() => false);

export const xsrfInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS' || !isTrustedBackendUrl(request.url)) {
    return next(request);
  }

  const token = readCookie('XSRF-TOKEN');
  return next(token ? request.clone({ setHeaders: { 'X-XSRF-TOKEN': token } }) : request);
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : null;
}
