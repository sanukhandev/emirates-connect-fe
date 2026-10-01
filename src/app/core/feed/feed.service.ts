import { HttpClient, HttpParams } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthStateService } from '../auth/auth-state.service';
import { Post } from '../post/post.models';
import { FeedPage } from './feed.models';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private requestVersion = 0;
  private previousUserId: number | null | undefined;

  readonly posts = signal<Post[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly loadingInitial = signal(false);
  readonly loadingMore = signal(false);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadMoreError = signal<string | null>(null);
  readonly hasMore = signal(false);

  constructor() {
    effect(() => {
      const userId = this.authState.currentUser()?.id ?? null;
      if (this.previousUserId !== undefined && this.previousUserId !== userId) this.reset();
      this.previousUserId = userId;
    });
  }

  loadInitial(): void {
    if (this.loadingInitial() || this.refreshing()) return;
    this.fetchFirstPage(false);
  }

  refresh(): void {
    if (this.refreshing()) return;
    this.fetchFirstPage(true);
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loadingInitial() || this.loadingMore() || this.refreshing()) return;

    const version = this.requestVersion;
    this.loadingMore.set(true);
    this.loadMoreError.set(null);
    this.http.get<FeedPage>(`${environment.apiBaseUrl}/feed`, { params: new HttpParams().set('cursor', cursor) }).pipe(
      finalize(() => { if (version === this.requestVersion) this.loadingMore.set(false); }),
    ).subscribe({
      next: (response) => {
        if (version !== this.requestVersion) return;
        this.appendUnique(response.data);
        this.setCursor(response.meta.next_cursor);
      },
      error: (error: unknown) => {
        if (version !== this.requestVersion) return;
        if ((error as { status?: number }).status === 422) this.setCursor(null);
        this.loadMoreError.set(this.errorMessage(error));
      },
    });
  }

  reset(): void {
    this.requestVersion += 1;
    this.posts.set([]);
    this.nextCursor.set(null);
    this.hasMore.set(false);
    this.error.set(null);
    this.loadMoreError.set(null);
    this.loadingInitial.set(false);
    this.loadingMore.set(false);
    this.refreshing.set(false);
  }

  removePost(id: number): void {
    this.posts.update((posts) => posts.filter((post) => post.id !== id));
  }

  errorMessage(error: unknown): string {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Please sign in to continue.';
    if (status === 403) return 'Your account cannot access the feed.';
    if (status === 422) return 'The feed could not load. Please refresh and try again.';
    return 'Unable to load the feed.';
  }

  private fetchFirstPage(isRefresh: boolean): void {
    const version = ++this.requestVersion;
    this.posts.set([]);
    this.nextCursor.set(null);
    this.hasMore.set(false);
    this.error.set(null);
    this.loadMoreError.set(null);
    (isRefresh ? this.refreshing : this.loadingInitial).set(true);
    this.http.get<FeedPage>(`${environment.apiBaseUrl}/feed`).pipe(
      finalize(() => {
        if (version !== this.requestVersion) return;
        (isRefresh ? this.refreshing : this.loadingInitial).set(false);
      }),
    ).subscribe({
      next: (response) => {
        if (version !== this.requestVersion) return;
        this.posts.set(this.unique(response.data));
        this.setCursor(response.meta.next_cursor);
      },
      error: (error: unknown) => {
        if (version === this.requestVersion) this.error.set(this.errorMessage(error));
      },
    });
  }

  private appendUnique(incoming: Post[]): void {
    this.posts.update((posts) => this.unique([...posts, ...incoming]));
  }

  private unique(posts: Post[]): Post[] {
    const seen = new Set<number>();
    return posts.filter((post) => !seen.has(post.id) && seen.add(post.id));
  }

  private setCursor(cursor: string | null): void {
    this.nextCursor.set(cursor);
    this.hasMore.set(cursor !== null);
  }
}
