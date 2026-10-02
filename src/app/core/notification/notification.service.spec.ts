import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { NotificationService } from './notification.service';
import { Notification } from './notification.models';

const notification = (id: number, read_at: string | null = null): Notification => ({
  id, type: 'followed', actor: null, subject: null, data: {}, read_at, created_at: '2026-01-01T00:00:00Z',
});
const page = (data: Notification[], next_cursor: string | null) => ({ data, links: { first: null, last: null, prev: null, next: null }, meta: { per_page: 20, next_cursor, prev_cursor: null, path: `${environment.apiBaseUrl}/notifications` } });

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NotificationService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads unread notifications and passes an opaque cursor without duplicates', () => {
    service.loadInitial(true);
    const first = http.expectOne((request) => request.url === `${environment.apiBaseUrl}/notifications` && request.params.get('unread') === 'true');
    first.flush(page([notification(1), notification(2)], 'opaque-cursor'));
    service.loadMore(true);
    const second = http.expectOne((request) => request.params.get('cursor') === 'opaque-cursor' && request.params.get('unread') === 'true');
    second.flush(page([notification(2), notification(3)], null));
    expect(service.notifications().map((item) => item.id)).toEqual([1, 2, 3]);
    expect(service.hasMore()).toBe(false);
  });

  it('loads the authoritative unread count and marks single and all rows read', () => {
    TestBed.inject(AuthStateService).setUser({ id: 1 } as never);
    TestBed.flushEffects();
    http.expectOne(`${environment.apiBaseUrl}/notifications/unread-count`).flush({ count: 2 });
    service.loadInitial();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/notifications`).flush(page([notification(1), notification(2, '2026-01-01T00:00:00Z')], null));
    service.markRead(service.notifications()[0]).subscribe();
    http.expectOne(`${environment.apiBaseUrl}/notifications/1/read`).flush({ data: notification(1, '2026-01-02T00:00:00Z') });
    expect(service.unreadCount()).toBe(1);
    service.markRead(service.notifications()[0]).subscribe();
    http.expectNone(`${environment.apiBaseUrl}/notifications/1/read`);
    service.markAllRead().subscribe();
    http.expectOne(`${environment.apiBaseUrl}/notifications/read-all`).flush({ updated: 1 });
    expect(service.unreadCount()).toBe(0);
    expect(service.notifications().every((item) => item.read_at !== null)).toBe(true);
  });

  it('resets notification state when the authenticated user changes', () => {
    const authState = TestBed.inject(AuthStateService);
    authState.setUser({ id: 1 } as never);
    TestBed.flushEffects();
    http.expectOne(`${environment.apiBaseUrl}/notifications/unread-count`).flush({ count: 1 });
    service.loadInitial();
    http.expectOne((request) => request.url === `${environment.apiBaseUrl}/notifications`).flush(page([notification(1)], null));
    expect(service.notifications()).toHaveLength(1);
    authState.setUser({ id: 2 } as never);
    TestBed.flushEffects();
    expect(service.notifications()).toEqual([]);
    expect(service.nextCursor()).toBeNull();
    http.expectOne(`${environment.apiBaseUrl}/notifications/unread-count`).flush({ count: 0 });
  });
});
