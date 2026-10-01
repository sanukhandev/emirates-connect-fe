import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

describe('auth guards', () => {
  it('allows authenticated users into protected routes', async () => {
    const auth = { initialize: () => of(undefined), isAuthenticated: () => true };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, provideRouter([])] });

    const result = await firstValueFrom(TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/' } as never)) as Observable<boolean>);
    expect(result).toBe(true);
  });

  it('redirects guests to login and authenticated users away from guest routes', async () => {
    const guestAuth = { initialize: () => of(undefined), isAuthenticated: () => false };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: guestAuth }, provideRouter([])] });
    const guestResult = await firstValueFrom(TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/account' } as never)) as Observable<boolean | ReturnType<Router['createUrlTree']>>);
    expect((guestResult as ReturnType<Router['createUrlTree']>).toString()).toContain('/login');

    TestBed.resetTestingModule();
    const authenticatedAuth = { initialize: () => of(undefined), isAuthenticated: () => true };
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: authenticatedAuth }, provideRouter([])] });
    const authenticatedResult = await firstValueFrom(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)) as Observable<boolean | ReturnType<Router['createUrlTree']>>);
    expect((authenticatedResult as ReturnType<Router['createUrlTree']>).toString()).toBe('/');
  });
});
