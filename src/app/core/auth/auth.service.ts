import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AccountUpdatePayload,
  ApiResponse,
  AuthPayload,
  ResetPasswordPayload,
  User,
  ValidationErrorResponse,
} from './auth.models';
import { AuthStateService } from './auth-state.service';

interface Credentials {
  email: string;
  password: string;
}

interface RegistrationPayload extends Credentials {
  name: string;
  password_confirmation: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly state = inject(AuthStateService);
  private initialization$?: Observable<void>;

  readonly currentUser = this.state.currentUser;
  readonly isAuthenticated = this.state.isAuthenticated;
  readonly isInitializing = this.state.isInitializing;

  initialize(): Observable<void> {
    if (this.initialization$) {
      return this.initialization$;
    }

    this.state.setInitializing(true);
    this.initialization$ = this.http.get<ApiResponse<User>>(`${environment.apiBaseUrl}/me`).pipe(
      tap((response) => this.state.setUser(response.data)),
      catchError(() => {
        this.state.clear();
        return of(null);
      }),
      map(() => undefined),
      finalize(() => this.state.setInitializing(false)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.initialization$;
  }

  getCsrfCookie(): Observable<void> {
    return this.http.get<void>(`${environment.backendOrigin}/sanctum/csrf-cookie`).pipe(map(() => undefined));
  }

  login(credentials: Credentials): Observable<User> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post<ApiResponse<AuthPayload>>(`${environment.apiBaseUrl}/auth/login`, credentials)),
      map((response) => response.data.user),
      tap((user) => this.state.setUser(user)),
    );
  }

  register(payload: RegistrationPayload): Observable<User> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post<ApiResponse<AuthPayload>>(`${environment.apiBaseUrl}/auth/register`, payload)),
      map((response) => response.data.user),
      tap((user) => this.state.setUser(user)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      map(() => undefined),
      finalize(() => this.state.clear()),
    );
  }

  updateAccount(payload: AccountUpdatePayload): Observable<User> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.patch<ApiResponse<User>>(`${environment.apiBaseUrl}/me`, payload)),
      map((response) => response.data),
      tap((user) => this.state.setUser(user)),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post(`${environment.apiBaseUrl}/auth/forgot-password`, { email })),
      map(() => undefined),
    );
  }

  resetPassword(payload: ResetPasswordPayload): Observable<void> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post(`${environment.apiBaseUrl}/auth/reset-password`, payload)),
      map(() => undefined),
    );
  }

  resendVerification(): Observable<void> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post(`${environment.apiBaseUrl}/auth/email/verification-notification`, {})),
      map(() => undefined),
    );
  }

  validationErrors(error: unknown): Record<string, string[]> {
    const response = error as { error?: ValidationErrorResponse };
    return response.error?.errors ?? {};
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Invalid email or password.';
    if (status === 403) return 'Your account is currently unavailable.';
    if (status === 429) return 'Too many attempts. Please try again shortly.';
    if (status === 422) return 'Please check the highlighted fields.';
    return 'We could not connect to Emirates Connect.';
  }
}
