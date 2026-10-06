import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiscoveryUser { id: number; name: string; profile?: { display_name?: string | null; headline?: string | null; emirate?: string | null; avatar_url?: string | null; is_verified?: boolean }; is_following?: boolean; }
export interface DiscoveryBusiness { id: number; name: string; slug: string; industry?: string | null; emirate?: string | null; logo_url?: string | null; is_verified?: boolean; is_following?: boolean; }
export interface DiscoveryEvent { id: number; title: string; description?: string | null; venue?: string | null; emirate?: string | null; starts_at: string; ends_at?: string | null; attendees_count?: number; is_rsvped?: boolean; }
export interface DiscoveryResponse { users: DiscoveryUser[]; businesses: DiscoveryBusiness[]; trending: { tag: string; posts_count: number }[]; events: DiscoveryEvent[]; }

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  readonly data = signal<DiscoveryResponse | null>(null);
  load(): Observable<DiscoveryResponse> { return this.http.get<{ data: DiscoveryResponse }>(`${environment.apiBaseUrl}/discovery`).pipe(map((r) => r.data), tap((data) => this.data.set(data))); }
  followUser(id: number): Observable<void> { return this.http.put<void>(`${environment.apiBaseUrl}/users/${id}/follow`, {}); }
  unfollowUser(id: number): Observable<void> { return this.http.delete<void>(`${environment.apiBaseUrl}/users/${id}/follow`); }
  followBusiness(slug: string): Observable<void> { return this.http.put<void>(`${environment.apiBaseUrl}/businesses/${encodeURIComponent(slug)}/follow`, {}); }
  unfollowBusiness(slug: string): Observable<void> { return this.http.delete<void>(`${environment.apiBaseUrl}/businesses/${encodeURIComponent(slug)}/follow`); }
}
