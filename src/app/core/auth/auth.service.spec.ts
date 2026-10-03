import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { User } from './auth.models';

const user: User = {
  id: 1,
  name: 'Sanu Khan',
  email: 'sanu@example.com',
  email_verified_at: null,
  account_status: 'active',
  created_at: '2026-01-01T00:00:00.000000Z',
  updated_at: '2026-01-01T00:00:00.000000Z',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, AuthStateService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches CSRF before SPA login and stores the returned user without a token', async () => {
    const result = firstValueFrom(service.login({ email: user.email, password: 'StrongPassword123!' }));

    http.expectOne(`${environment.backendOrigin}/sanctum/csrf-cookie`).flush(null);
    const login = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(login.request.withCredentials).toBe(false);
    expect(login.request.body).toEqual({ email: user.email, password: 'StrongPassword123!' });
    login.flush({ data: { user } });
    http.expectOne(`${environment.apiBaseUrl}/me`).flush({ data: user });

    await expect(result).resolves.toEqual(user);
    expect(service.currentUser()).toEqual(user);
  });

  it('fetches CSRF before registration and does not expect a token', async () => {
    const payload = { name: user.name, email: user.email, password: 'StrongPassword123!', password_confirmation: 'StrongPassword123!' };
    const result = firstValueFrom(service.register(payload));

    http.expectOne(`${environment.backendOrigin}/sanctum/csrf-cookie`).flush(null);
    const register = http.expectOne(`${environment.apiBaseUrl}/auth/register`);
    register.flush({ data: { user } });
    http.expectOne(`${environment.apiBaseUrl}/me`).flush({ data: user });

    await expect(result).resolves.toEqual(user);
    expect(service.currentUser()).toEqual(user);
  });

  it('treats a failed /me initialization as a guest', async () => {
    const result = firstValueFrom(service.initialize());
    http.expectOne(`${environment.apiBaseUrl}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(result).resolves.toBeUndefined();
    expect(service.currentUser()).toBeNull();
    expect(service.isInitializing()).toBe(false);
  });

  it('clears in-memory state after logout', async () => {
    TestBed.inject(AuthStateService).setUser(user);
    const result = firstValueFrom(service.logout());
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/logout`);
    expect(request.request.method).toBe('POST');
    request.flush(null);

    await expect(result).resolves.toBeUndefined();
    expect(service.currentUser()).toBeNull();
  });

  it('does not let a stale initialization response restore a logged-out user', async () => {
    const initialization = firstValueFrom(service.initialize());
    const initializationRequest = http.expectOne(`${environment.apiBaseUrl}/me`);

    const logout = firstValueFrom(service.logout());
    http.expectOne(`${environment.apiBaseUrl}/auth/logout`).flush(null);
    await expect(logout).resolves.toBeUndefined();

    initializationRequest.flush({ data: user });
    await expect(initialization).resolves.toBeUndefined();
    expect(service.currentUser()).toBeNull();
  });
});
