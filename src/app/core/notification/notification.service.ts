import { HttpClient, HttpParams } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { Notification, NotificationListResponse } from './notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private requestVersion = 0;
  private previousUserId: number | null | undefined;

  readonly notifications = signal<Notification[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadMoreError = signal<string | null>(null);
  readonly hasMore = signal(false);

  constructor() {
    effect(() => {
      const userId = this.authState.currentUser()?.id ?? null;
      const changed = this.previousUserId !== undefined && this.previousUserId !== userId;
      if (changed) this.reset();
      if (userId !== null && this.previousUserId !== userId) this.refreshUnreadCount();
      this.previousUserId = userId;
    });
  }

  loadInitial(unread = false): void {
    if (this.loading() || this.loadingMore()) return;
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.notifications.set([]);
    this.nextCursor.set(null);
    this.hasMore.set(false);
    this.error.set(null);
    this.loadMoreError.set(null);
    this.list(unread).pipe(finalize(() => { if (version === this.requestVersion) this.loading.set(false); })).subscribe({
      next: (response) => {
        if (version !== this.requestVersion) return;
        this.notifications.set(this.unique(response.data));
        this.setCursor(response.meta.next_cursor);
      },
      error: (error: unknown) => { if (version === this.requestVersion) this.error.set(this.errorMessage(error)); },
    });
  }

  loadMore(unread = false): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loading() || this.loadingMore()) return;
    const version = this.requestVersion;
    this.loadingMore.set(true);
    this.loadMoreError.set(null);
    this.list(unread, cursor).pipe(finalize(() => { if (version === this.requestVersion) this.loadingMore.set(false); })).subscribe({
      next: (response) => {
        if (version !== this.requestVersion) return;
        this.notifications.update((items) => this.unique([...items, ...response.data]));
        this.setCursor(response.meta.next_cursor);
      },
      error: () => { if (version === this.requestVersion) this.loadMoreError.set('Couldn’t load more notifications.'); },
    });
  }

  refreshUnreadCount(): void {
    if (!this.authState.currentUser()) return;
    this.http.get<{ count: number }>(`${environment.apiBaseUrl}/notifications/unread-count`).subscribe({
      next: (response) => this.unreadCount.set(response.count),
    });
  }

  markRead(notification: Notification): Observable<Notification> {
    if (notification.read_at) return of(notification);
    const previous = this.notifications();
    this.notifications.update((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
    this.unreadCount.update((count) => Math.max(0, count - 1));
    return this.http.patch<{ data: Notification }>(`${environment.apiBaseUrl}/notifications/${notification.id}/read`, {}).pipe(
      catchError((error: unknown) => {
        this.notifications.set(previous);
        this.unreadCount.update((count) => count + 1);
        return throwError(() => error);
      }),
      map((response) => response.data),
    );
  }

  markAllRead(): Observable<{ updated: number }> {
    const previous = this.notifications();
    this.notifications.update((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
    const previousCount = this.unreadCount();
    this.unreadCount.set(0);
    return this.http.post<{ updated: number }>(`${environment.apiBaseUrl}/notifications/read-all`, {}).pipe(
      catchError((error: unknown) => {
        this.notifications.set(previous);
        this.unreadCount.set(previousCount);
        return throwError(() => error);
      }),
    );
  }

  reset(): void {
    this.requestVersion += 1;
    this.notifications.set([]);
    this.nextCursor.set(null);
    this.unreadCount.set(0);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.error.set(null);
    this.loadMoreError.set(null);
    this.hasMore.set(false);
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Please sign in to view notifications.';
    if (status === 403) return 'Your account cannot access notifications.';
    return 'Unable to load notifications.';
  }

  private list(unread: boolean, cursor?: string): Observable<NotificationListResponse> {
    let params = new HttpParams().set('per_page', 20);
    if (unread) params = params.set('unread', true);
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<NotificationListResponse>(`${environment.apiBaseUrl}/notifications`, { params });
  }

  private unique(items: Notification[]): Notification[] {
    const seen = new Set<number>();
    return items.filter((item) => !seen.has(item.id) && seen.add(item.id));
  }

  private setCursor(cursor: string | null): void {
    this.nextCursor.set(cursor);
    this.hasMore.set(cursor !== null);
  }

}
