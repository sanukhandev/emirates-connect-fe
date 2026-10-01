import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { FeedService } from './feed.service';

const post = (id: number) => ({ id, body: `Post ${id}`, status: 'published' as const, published_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', author: { type: 'user' as const, id: 1, name: 'User', display_name: 'User', headline: null, avatar_url: null }, media: [] });
const page = (data: ReturnType<typeof post>[], next_cursor: string | null) => ({ data, meta: { per_page: 20, next_cursor, prev_cursor: null } });

describe('FeedService', () => {
  let service: FeedService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FeedService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FeedService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the first page, passes opaque cursors, and removes duplicates', () => {
    service.loadInitial();
    http.expectOne(`${environment.apiBaseUrl}/feed`).flush(page([post(1), post(2)], 'cursor-A'));
    expect(service.posts().map((item) => item.id)).toEqual([1, 2]);
    expect(service.hasMore()).toBe(true);

    service.loadMore();
    const request = http.expectOne((candidate) => candidate.url === `${environment.apiBaseUrl}/feed` && candidate.params.get('cursor') === 'cursor-A');
    request.flush(page([post(2), post(3)], null));
    expect(service.posts().map((item) => item.id)).toEqual([1, 2, 3]);
    expect(service.hasMore()).toBe(false);
  });

  it('refreshes by replacing the feed instead of appending', () => {
    service.loadInitial();
    http.expectOne(`${environment.apiBaseUrl}/feed`).flush(page([post(1)], 'cursor-A'));
    service.refresh();
    http.expectOne(`${environment.apiBaseUrl}/feed`).flush(page([post(4)], null));
    expect(service.posts().map((item) => item.id)).toEqual([4]);
    expect(service.nextCursor()).toBeNull();
  });

  it('keeps existing posts when loading more fails and clears on reset', () => {
    service.loadInitial();
    http.expectOne(`${environment.apiBaseUrl}/feed`).flush(page([post(1)], 'cursor-A'));
    service.loadMore();
    http.expectOne((candidate) => candidate.params.get('cursor') === 'cursor-A').flush({ status: 422 }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(service.posts().map((item) => item.id)).toEqual([1]);
    expect(service.loadMoreError()).toBe('The feed could not load. Please refresh and try again.');
    service.reset();
    expect(service.posts()).toEqual([]);
    expect(service.hasMore()).toBe(false);
  });

  it('clears the in-memory feed when the authenticated user changes', () => {
    service.loadInitial();
    http.expectOne(`${environment.apiBaseUrl}/feed`).flush(page([post(1)], null));
    const authState = TestBed.inject(AuthStateService);
    authState.setUser({ id: 9 } as never);
    TestBed.flushEffects();
    authState.clear();
    TestBed.flushEffects();
    expect(service.posts()).toEqual([]);
  });
});
