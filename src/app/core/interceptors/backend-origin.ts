import { environment } from '../../../environments/environment';

export function isTrustedBackendUrl(url: string): boolean {
  if (!environment.backendOrigin) {
    return url.startsWith('/');
  }

  try {
    return new URL(url, window.location.origin).origin === new URL(environment.backendOrigin).origin;
  } catch {
    return false;
  }
}
