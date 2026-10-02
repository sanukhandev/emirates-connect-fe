import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Reel, ReelCreatePayload, ReelFeedResponse, ReelResponse } from './reel.models';

@Injectable({ providedIn: 'root' })
export class ReelService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reels`;

  getFeed(cursor?: string): Observable<ReelFeedResponse> {
    return this.http.get<ReelFeedResponse>(this.baseUrl, { params: this.cursorParams(cursor) });
  }

  getReel(id: number): Observable<Reel> {
    return this.http.get<ReelResponse>(`${this.baseUrl}/${id}`).pipe(map((response) => response.data));
  }

  createReel(payload: ReelCreatePayload): Observable<Reel> {
    return this.http.post<ReelResponse>(this.baseUrl, payload).pipe(map((response) => response.data));
  }

  uploadVideo(id: number, file: File): Observable<Reel> {
    const form = new FormData();
    form.append('video', file);
    return this.http.post<ReelResponse>(`${this.baseUrl}/${id}/video`, form).pipe(map((response) => response.data));
  }

  updateReel(id: number, caption: string | null): Observable<Reel> {
    return this.http.patch<ReelResponse>(`${this.baseUrl}/${id}`, { caption }).pipe(map((response) => response.data));
  }

  deleteReel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getMyReels(cursor?: string): Observable<ReelFeedResponse> {
    return this.http.get<ReelFeedResponse>(`${environment.apiBaseUrl}/me/reels`, { params: this.cursorParams(cursor) });
  }

  getUserReels(id: number, cursor?: string): Observable<ReelFeedResponse> {
    return this.http.get<ReelFeedResponse>(`${environment.apiBaseUrl}/users/${id}/reels`, { params: this.cursorParams(cursor) });
  }

  getBusinessReels(slug: string, cursor?: string): Observable<ReelFeedResponse> {
    return this.http.get<ReelFeedResponse>(`${environment.apiBaseUrl}/businesses/${encodeURIComponent(slug)}/reels`, { params: this.cursorParams(cursor) });
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Please sign in to continue.';
    if (status === 403) return 'You do not have permission to manage this reel.';
    if (status === 404) return 'Reel unavailable.';
    if (status === 422) return 'Please choose one MP4 video up to 100 MB.';
    if (status === 429) return 'Too many uploads. Please try again later.';
    return 'We could not load this reel. Please try again.';
  }

  private cursorParams(cursor?: string): HttpParams {
    return cursor ? new HttpParams().set('cursor', cursor) : new HttpParams();
  }
}
