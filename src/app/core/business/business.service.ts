import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MetaOption } from '../profile/profile.models';
import {
  AddMemberPayload,
  ApiPage,
  Business,
  BusinessMember,
  BusinessPayload,
  BusinessResponse,
  MemberResponse,
  PaginationMeta,
} from './business.models';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/businesses`;

  readonly currentBusiness = signal<Business | null>(null);
  readonly myBusinesses = signal<Business[]>([]);
  readonly myBusinessesMeta = signal<PaginationMeta | null>(null);
  readonly members = signal<BusinessMember[]>([]);
  readonly membersMeta = signal<PaginationMeta | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingLogo = signal(false);
  readonly isUploadingCover = signal(false);

  createBusiness(payload: BusinessPayload): Observable<Business> {
    this.isSaving.set(true);
    return this.http.post<BusinessResponse>(this.baseUrl, payload).pipe(
      map((response) => response.data),
      tap({ next: (business) => this.currentBusiness.set(business), finalize: () => this.isSaving.set(false) }),
    );
  }

  getBusiness(slug: string): Observable<Business> {
    this.isLoading.set(true);
    return this.http.get<BusinessResponse>(`${this.baseUrl}/${encodeURIComponent(slug)}`).pipe(
      map((response) => response.data),
      tap({ next: (business) => this.currentBusiness.set(business), finalize: () => this.isLoading.set(false) }),
    );
  }

  updateBusiness(slug: string, payload: Partial<BusinessPayload>): Observable<Business> {
    this.isSaving.set(true);
    return this.http.patch<BusinessResponse>(`${this.baseUrl}/${encodeURIComponent(slug)}`, payload).pipe(
      map((response) => response.data),
      tap({ next: (business) => this.currentBusiness.set(business), finalize: () => this.isSaving.set(false) }),
    );
  }

  deactivateBusiness(slug: string): Observable<void> {
    this.isSaving.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(slug)}`).pipe(
      tap({ next: () => this.currentBusiness.update((business) => business ? { ...business, status: 'inactive' } : null), finalize: () => this.isSaving.set(false) }),
      map(() => undefined),
    );
  }

  getMyBusinesses(page = 1): Observable<ApiPage<Business>> {
    this.isLoading.set(true);
    return this.http.get<ApiPage<Business>>(`${environment.apiBaseUrl}/me/businesses?page=${page}`).pipe(
      tap({ next: (response) => { this.myBusinesses.set(response.data); this.myBusinessesMeta.set(response.meta); }, finalize: () => this.isLoading.set(false) }),
    );
  }

  getMembers(slug: string, page = 1): Observable<ApiPage<BusinessMember>> {
    this.isLoading.set(true);
    return this.http.get<ApiPage<BusinessMember>>(`${this.baseUrl}/${encodeURIComponent(slug)}/members?page=${page}`).pipe(
      tap({ next: (response) => { this.members.set(response.data); this.membersMeta.set(response.meta); }, finalize: () => this.isLoading.set(false) }),
    );
  }

  addMember(slug: string, payload: AddMemberPayload): Observable<BusinessMember> {
    this.isSaving.set(true);
    return this.http.post<MemberResponse>(`${this.baseUrl}/${encodeURIComponent(slug)}/members`, payload).pipe(
      map((response) => response.data),
      tap({ finalize: () => this.isSaving.set(false) }),
    );
  }

  updateMemberRole(slug: string, memberId: number, role: 'admin' | 'editor'): Observable<BusinessMember> {
    this.isSaving.set(true);
    return this.http.patch<MemberResponse>(`${this.baseUrl}/${encodeURIComponent(slug)}/members/${memberId}`, { role }).pipe(
      map((response) => response.data),
      tap({ finalize: () => this.isSaving.set(false) }),
    );
  }

  removeMember(slug: string, memberId: number): Observable<void> {
    this.isSaving.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(slug)}/members/${memberId}`).pipe(
      map(() => undefined),
      tap({ finalize: () => this.isSaving.set(false) }),
    );
  }

  uploadLogo(slug: string, file: File): Observable<Business> {
    const form = new FormData();
    form.append('logo', file);
    this.isUploadingLogo.set(true);
    return this.http.post<BusinessResponse>(`${this.baseUrl}/${encodeURIComponent(slug)}/logo`, form).pipe(
      map((response) => response.data),
      tap({ next: (business) => this.currentBusiness.set(business), finalize: () => this.isUploadingLogo.set(false) }),
    );
  }

  deleteLogo(slug: string): Observable<void> {
    this.isUploadingLogo.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(slug)}/logo`).pipe(
      tap(() => this.currentBusiness.update((business) => business ? { ...business, logo_url: null } : null)),
      map(() => undefined),
      tap({ finalize: () => this.isUploadingLogo.set(false) }),
    );
  }

  uploadCover(slug: string, file: File): Observable<Business> {
    const form = new FormData();
    form.append('cover_image', file);
    this.isUploadingCover.set(true);
    return this.http.post<BusinessResponse>(`${this.baseUrl}/${encodeURIComponent(slug)}/cover-image`, form).pipe(
      map((response) => response.data),
      tap({ next: (business) => this.currentBusiness.set(business), finalize: () => this.isUploadingCover.set(false) }),
    );
  }

  deleteCover(slug: string): Observable<void> {
    this.isUploadingCover.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${encodeURIComponent(slug)}/cover-image`).pipe(
      tap(() => this.currentBusiness.update((business) => business ? { ...business, cover_image_url: null } : null)),
      map(() => undefined),
      tap({ finalize: () => this.isUploadingCover.set(false) }),
    );
  }

  getIndustries(): Observable<MetaOption[]> {
    return this.http.get<{ data: MetaOption[] }>(`${environment.apiBaseUrl}/meta/industries`).pipe(map((response) => response.data));
  }

  getEmirates(): Observable<MetaOption[]> {
    return this.http.get<{ data: MetaOption[] }>(`${environment.apiBaseUrl}/meta/emirates`).pipe(map((response) => response.data));
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Please sign in to continue.';
    if (status === 403) return 'You do not have permission to manage this business.';
    if (status === 404) return 'Business not found.';
    if (status === 422) return 'Please check the highlighted fields.';
    return 'We could not complete that business request. Please try again.';
  }

  validationErrors(error: unknown): Record<string, string[]> {
    return (error as { error?: { errors?: Record<string, string[]> } }).error?.errors ?? {};
  }
}
