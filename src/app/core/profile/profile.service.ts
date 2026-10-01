import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { MetaOption, ProfileResponse, ProfileUpdatePayload, PublicUser, PublicUserResponse } from './profile.models';
import { UserProfile } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);

  readonly profile = signal<UserProfile | null>(null);
  readonly industries = signal<MetaOption[]>([]);
  readonly emirates = signal<MetaOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);
  readonly isUploadingCover = signal(false);

  getCurrentProfile(): Observable<UserProfile> {
    this.isLoading.set(true);
    return this.http.get<ProfileResponse>(`${environment.apiBaseUrl}/me/profile`).pipe(
      map((response) => response.data),
      tap({ next: (profile) => this.setProfile(profile), finalize: () => this.isLoading.set(false) }),
    );
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<UserProfile> {
    this.isSaving.set(true);
    return this.http.patch<ProfileResponse>(`${environment.apiBaseUrl}/me/profile`, payload).pipe(
      map((response) => response.data),
      tap({ next: (profile) => this.setProfile(profile), finalize: () => this.isSaving.set(false) }),
    );
  }

  completeOnboarding(payload: ProfileUpdatePayload): Observable<UserProfile> {
    this.isSaving.set(true);
    return this.http.post<ProfileResponse>(`${environment.apiBaseUrl}/me/onboarding/complete`, payload).pipe(
      map((response) => response.data),
      tap({ next: (profile) => this.setProfile(profile), finalize: () => this.isSaving.set(false) }),
    );
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const form = new FormData();
    form.append('avatar', file);
    this.isUploadingAvatar.set(true);
    return this.http.post<ProfileResponse>(`${environment.apiBaseUrl}/me/profile/avatar`, form).pipe(
      map((response) => response.data),
      tap({ next: (profile) => this.setProfile(profile), finalize: () => this.isUploadingAvatar.set(false) }),
    );
  }

  deleteAvatar(): Observable<void> {
    this.isUploadingAvatar.set(true);
    return this.http.delete<void>(`${environment.apiBaseUrl}/me/profile/avatar`).pipe(
      tap(() => this.patchMedia('avatar_url', null)),
      map(() => undefined),
      tap({ finalize: () => this.isUploadingAvatar.set(false) }),
    );
  }

  uploadCoverImage(file: File): Observable<UserProfile> {
    const form = new FormData();
    form.append('cover_image', file);
    this.isUploadingCover.set(true);
    return this.http.post<ProfileResponse>(`${environment.apiBaseUrl}/me/profile/cover-image`, form).pipe(
      map((response) => response.data),
      tap({ next: (profile) => this.setProfile(profile), finalize: () => this.isUploadingCover.set(false) }),
    );
  }

  deleteCoverImage(): Observable<void> {
    this.isUploadingCover.set(true);
    return this.http.delete<void>(`${environment.apiBaseUrl}/me/profile/cover-image`).pipe(
      tap(() => this.patchMedia('cover_image_url', null)),
      map(() => undefined),
      tap({ finalize: () => this.isUploadingCover.set(false) }),
    );
  }

  getPublicProfile(userId: number): Observable<PublicUser> {
    return this.http.get<PublicUserResponse>(`${environment.apiBaseUrl}/users/${userId}`).pipe(map((response) => response.data));
  }

  getIndustries(): Observable<MetaOption[]> {
    return this.http.get<{ data: MetaOption[] }>(`${environment.apiBaseUrl}/meta/industries`).pipe(
      map((response) => response.data),
      tap((options) => this.industries.set(options)),
    );
  }

  getEmirates(): Observable<MetaOption[]> {
    return this.http.get<{ data: MetaOption[] }>(`${environment.apiBaseUrl}/meta/emirates`).pipe(
      map((response) => response.data),
      tap((options) => this.emirates.set(options)),
    );
  }

  validationErrors(error: unknown): Record<string, string[]> {
    return (error as { error?: { errors?: Record<string, string[]> } }).error?.errors ?? {};
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 422) return 'Please check the highlighted fields.';
    if (status === 404) return 'Profile not found.';
    return 'We could not save your profile. Please try again.';
  }

  private setProfile(profile: UserProfile): void {
    this.profile.set(profile);
    this.authState.updateProfile(profile);
  }

  private patchMedia(field: 'avatar_url' | 'cover_image_url', value: null): void {
    const profile = this.profile();
    if (profile) this.setProfile({ ...profile, [field]: value });
  }
}
