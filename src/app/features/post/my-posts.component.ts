import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Post } from '../../core/post/post.models';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { PostComposerComponent } from './post-composer.component';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-posts',
  imports: [
    RouterLink,
    PostCardComponent,
    PostComposerComponent,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    AppHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Sticky Header -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[760px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Top Application Header -->
          <app-header />

          <!-- Page Header Card -->
          <header class="rounded-2xl border border-border-subtle bg-surface-card p-5 sm:p-6 shadow-card">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Content Studio</p>
                <h1 class="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                  My Posts
                </h1>
                <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                  Manage your published updates, announcements, and draft articles.
                </p>
              </div>

              <a
                routerLink="/profile"
                class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-secondary px-3.5 py-2 text-xs font-semibold text-content-primary transition hover:border-brand-primary/40 hover:text-brand-primary"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to profile</span>
              </a>
            </div>
          </header>

          <!-- Post Composer Widget -->
          <div class="rounded-2xl border border-border-subtle bg-surface-card p-4 sm:p-5 shadow-card">
            <app-post-composer (saved)="saved($event)" />
          </div>

          <!-- Alert Notice -->
          @if (message()) {
            <p role="alert" class="rounded-xl border border-status-danger/30 bg-status-danger/10 p-3.5 text-xs sm:text-sm font-semibold text-status-danger">
              {{ message() }}
            </p>
          }

          <!-- Posts Stream -->
          <section class="space-y-4" aria-label="My published posts">
            @if (post.isLoading()) {
              <div class="space-y-4">
                <div class="h-40 animate-pulse rounded-2xl bg-surface-muted"></div>
                <div class="h-40 animate-pulse rounded-2xl bg-surface-muted"></div>
              </div>
            } @else if (!post.myPosts().length) {
              <app-empty-state
                icon="post"
                title="No posts published yet"
                description="Share insights, project updates, or business milestones with your UAE network."
              />
            } @else {
              @for (item of post.myPosts(); track item.id) {
                <app-post-card
                  [post]="item"
                  [management]="true"
                  (edit)="edit(item)"
                  (remove)="remove(item)"
                />
              }
            }
          </section>

          <!-- Pagination -->
          @if (post.myPostsMeta(); as meta) {
            @if (meta.last_page > 1) {
              <nav class="flex items-center justify-between gap-4 pt-2 text-xs sm:text-sm" aria-label="Post pages">
                <button
                  type="button"
                  class="ec-btn-secondary px-4 py-2"
                  (click)="load(meta.current_page - 1)"
                  [disabled]="meta.current_page <= 1 || post.isLoading()"
                >
                  Previous
                </button>
                <span class="text-content-muted">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
                <button
                  type="button"
                  class="ec-btn-secondary px-4 py-2"
                  (click)="load(meta.current_page + 1)"
                  [disabled]="meta.current_page >= meta.last_page || post.isLoading()"
                >
                  Next
                </button>
              </nav>
            }
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>

    <!-- Delete Confirmation Modal -->
    @if (pending(); as postItem) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-content-primary/40 px-4 backdrop-blur-xs" role="presentation">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-post-title"
          class="w-full max-w-md rounded-3xl border border-border-subtle bg-surface-card p-6 shadow-card"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger/10 text-status-danger">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <h2 id="delete-post-title" class="mt-4 text-xl font-bold text-content-primary">Delete this post?</h2>
          <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed">
            This post will be permanently deleted and removed from feed streams and search results.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="ec-btn-secondary"
              (click)="pending.set(null)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="ec-btn-danger"
              (click)="confirmRemove()"
            >
              Delete post
            </button>
          </div>
        </section>
      </div>
    }
  `,
})
export class MyPostsComponent {
  readonly post = inject(PostService);
  private readonly auth = inject(AuthService);
  readonly pending = signal<Post | null>(null);
  readonly message = signal('');
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  logout(): void {
    this.auth.logout();
  }

  load(page = 1): void {
    this.post.getMyPosts(page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.message.set(this.post.errorMessage(error)),
    });
  }

  saved(post: Post): void {
    if (post.author.type === 'business') {
      void this.router.navigate(['/businesses', post.author.slug]);
    } else {
      this.load();
    }
  }

  edit(post: Post): void {
    void this.router.navigate(['/posts', post.id, 'edit']);
  }

  remove(post: Post): void {
    this.pending.set(post);
  }

  confirmRemove(): void {
    const post = this.pending();
    if (!post) return;
    this.post.deletePost(post.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.pending.set(null);
        this.load();
      },
      error: (error: unknown) => {
        this.pending.set(null);
        this.message.set(this.post.errorMessage(error));
      },
    });
  }
}
