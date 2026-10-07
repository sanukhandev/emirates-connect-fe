import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminBusiness, AdminDashboard, AdminPageResponse, AdminReport, AdminUser, AdminVerification, ModerationAudit, SignedDocumentUrl } from './admin.models';

type Envelope<T> = { data: T };
type Query = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin`;

  dashboard(): Observable<AdminDashboard> { return this.http.get<Envelope<AdminDashboard>>(`${this.base}/dashboard`).pipe(map((response) => response.data)); }
  verifications(query: Query): Observable<AdminPageResponse<AdminVerification>> { return this.http.get<AdminPageResponse<AdminVerification>>(`${this.base}/verifications`, { params: this.params(query) }); }
  verification(id: number): Observable<AdminVerification> { return this.http.get<AdminVerification | Envelope<AdminVerification>>(`${this.base}/verifications/${id}`).pipe(map((response) => this.resource(response))); }
  approveVerification(id: number): Observable<AdminVerification> { return this.http.post<AdminVerification | Envelope<AdminVerification>>(`${this.base}/verifications/${id}/approve`, {}).pipe(map((response) => this.resource(response))); }
  rejectVerification(id: number, rejection_reason: string): Observable<AdminVerification> { return this.http.post<AdminVerification | Envelope<AdminVerification>>(`${this.base}/verifications/${id}/reject`, { rejection_reason }).pipe(map((response) => this.resource(response))); }
  documentUrl(id: number, documentId: number): Observable<SignedDocumentUrl> { return this.http.get<Envelope<SignedDocumentUrl>>(`${this.base}/verifications/${id}/documents/${documentId}`).pipe(map((response) => response.data)); }
  verificationAudit(query: Query): Observable<AdminPageResponse<import('./admin.models').VerificationAudit>> { return this.http.get<AdminPageResponse<import('./admin.models').VerificationAudit>>(`${this.base}/verifications/audit`, { params: this.params(query) }); }
  reports(query: Query): Observable<AdminPageResponse<AdminReport>> { return this.http.get<AdminPageResponse<AdminReport>>(`${this.base}/reports`, { params: this.params(query) }); }
  report(id: number): Observable<AdminReport> { return this.http.get<AdminReport | Envelope<AdminReport>>(`${this.base}/reports/${id}`).pipe(map((response) => this.resource(response))); }
  resolveReport(id: number, action: string, resolution: string): Observable<AdminReport> { return this.http.patch<AdminReport | Envelope<AdminReport>>(`${this.base}/reports/${id}`, { action, resolution }).pipe(map((response) => this.resource(response))); }
  moderationAudit(query: Query): Observable<AdminPageResponse<ModerationAudit>> { return this.http.get<AdminPageResponse<ModerationAudit>>(`${this.base}/moderation/audit`, { params: this.params(query) }); }
  users(query: Query): Observable<AdminPageResponse<AdminUser>> { return this.http.get<AdminPageResponse<AdminUser>>(`${this.base}/users`, { params: this.params(query) }); }
  user(id: number): Observable<AdminUser> { return this.http.get<AdminUser | Envelope<AdminUser>>(`${this.base}/users/${id}`).pipe(map((response) => this.resource(response))); }
  suspendUser(id: number, reason: string): Observable<AdminUser> { return this.http.post<AdminUser | Envelope<AdminUser>>(`${this.base}/users/${id}/suspend`, { reason }).pipe(map((response) => this.resource(response))); }
  businesses(query: Query): Observable<AdminPageResponse<AdminBusiness>> { return this.http.get<AdminPageResponse<AdminBusiness>>(`${this.base}/businesses`, { params: this.params(query) }); }
  business(id: number): Observable<AdminBusiness> { return this.http.get<AdminBusiness | Envelope<AdminBusiness>>(`${this.base}/businesses/${id}`).pipe(map((response) => this.resource(response))); }
  suspendBusiness(id: number, reason: string): Observable<AdminBusiness> { return this.http.post<AdminBusiness | Envelope<AdminBusiness>>(`${this.base}/businesses/${id}/suspend`, { reason }).pipe(map((response) => this.resource(response))); }
  createEvent(payload: { title: string; description: string; venue: string; emirate: string; starts_at: string; ends_at: string }): Observable<unknown> { return this.http.post(`${this.base}/events`, payload); }

  private params(query: Query): HttpParams { return Object.entries(query).reduce((params, [key, value]) => value === null || value === undefined || value === '' ? params : params.set(key, String(value)), new HttpParams()); }
  private resource<T extends { id: number }>(response: T | Envelope<T>): T { return 'id' in response ? response : response.data; }
}
