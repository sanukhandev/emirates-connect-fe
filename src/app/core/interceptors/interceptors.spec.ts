import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { authErrorInterceptor } from './auth-error.interceptor';
import { credentialsInterceptor } from './credentials.interceptor';
import { xsrfInterceptor } from './xsrf.interceptor';

describe('authentication interceptors', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;
  let state: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthStateService,
        provideHttpClient(withInterceptors([credentialsInterceptor, xsrfInterceptor, authErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    state = TestBed.inject(AuthStateService);
  });

  afterEach(() => http.verify());

  it('adds credentials only to trusted backend requests', () => {
    httpClient.get(`${environment.apiBaseUrl}/me`).subscribe();
    expect(http.expectOne(`${environment.apiBaseUrl}/me`).request.withCredentials).toBe(true);

    httpClient.get('https://example.com/resource').subscribe();
    expect(http.expectOne('https://example.com/resource').request.withCredentials).toBe(false);
  });

  it('copies the trusted Laravel XSRF cookie into the expected header', () => {
    document.cookie = 'XSRF-TOKEN=csrf%20value';
    httpClient.post(`${environment.apiBaseUrl}/me`, {}).subscribe();

    expect(http.expectOne(`${environment.apiBaseUrl}/me`).request.headers.get('X-XSRF-TOKEN')).toBe('csrf value');
  });

  it('clears in-memory authentication on a 401 without redirecting', async () => {
    state.setUser({ id: 1, name: 'Sanu', email: 'sanu@example.com', email_verified_at: null, account_status: 'active', created_at: '', updated_at: '' });
    const result = firstValueFrom(httpClient.get(`${environment.apiBaseUrl}/me`));
    http.expectOne(`${environment.apiBaseUrl}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(result).rejects.toBeTruthy();
    expect(state.currentUser()).toBeNull();
  });

  it('retries one safe 419 request after refreshing the CSRF cookie', async () => {
    const result = firstValueFrom(httpClient.get(`${environment.apiBaseUrl}/me`));
    http.expectOne(`${environment.apiBaseUrl}/me`).flush({}, { status: 419, statusText: 'Page Expired' });
    const csrf = http.expectOne(`${environment.backendOrigin}/sanctum/csrf-cookie`);
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush(null);
    const retry = http.match(`${environment.apiBaseUrl}/me`).find((request) => !request.cancelled);
    retry?.flush({ data: {} });

    await expect(result).resolves.toEqual({ data: {} });
  });

  it('does not replay a mutation after a 419 response', async () => {
    const result = firstValueFrom(httpClient.post(`${environment.apiBaseUrl}/me`, {}));
    http.expectOne(`${environment.apiBaseUrl}/me`).flush({}, { status: 419, statusText: 'Page Expired' });

    await expect(result).rejects.toMatchObject({ status: 419 });
    http.expectNone(`${environment.backendOrigin}/sanctum/csrf-cookie`);
  });
});
