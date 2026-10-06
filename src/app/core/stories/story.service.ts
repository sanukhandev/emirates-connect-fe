import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Story { id: number; body: string | null; media_url: string | null; media_type: string | null; expires_at: string; user: { id: number; name: string; avatar_url: string | null; is_verified: boolean }; }
@Injectable({ providedIn: 'root' })
export class StoryService {
  private readonly http = inject(HttpClient);
  readonly stories = signal<Story[]>([]);
  load(): Observable<Story[]> { return this.http.get<{ data: Story[] }>(`${environment.apiBaseUrl}/stories`).pipe(map((r) => r.data), tap((stories) => this.stories.set(stories))); }
  create(body: string, media?: File): Observable<Story> { const form = new FormData(); if (body.trim()) form.append('body', body.trim()); if (media) form.append('media', media); return this.http.post<{ data: Story }>(`${environment.apiBaseUrl}/stories`, form).pipe(map((r) => r.data), tap((story) => this.stories.update((items) => [story, ...items]))); }
}
