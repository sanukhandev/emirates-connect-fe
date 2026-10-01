import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { xsrfInterceptor } from './core/interceptors/xsrf.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([credentialsInterceptor, xsrfInterceptor, authErrorInterceptor])),
    provideAppInitializer(() => inject(AuthService).initialize()),
    provideRouter(routes),
  ]
};
