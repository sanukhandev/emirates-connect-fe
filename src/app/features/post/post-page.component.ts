import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { CommentSectionComponent } from '../../shared/components/comment-section.component';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-post-page',
  imports: [
    RouterLink,
    PostCardComponent,
    CommentSectionComponent,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    AppHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Navigation -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[760px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Top Application Header -->
          <app-header />

          <!-- Back Navigation Bar -->
          <div class="flex items-center justify-between">
            <a
              routerLink="/"
              class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-card px-3.5 py-2 text-xs font-semibold text-content-primary shadow-xs transition hover:border-brand-primary/40 hover:text-brand-primary"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to feed</span>
            </a>
          </div>

          <!-- Loading Shimmer -->
          @if (post.isLoading()) {
            <div class="space-y-4">
              <div class="h-64 animate-pulse rounded-2xl bg-surface-muted"></div>
              <div class="h-40 animate-pulse rounded-2xl bg-surface-muted"></div>
            </div>
          } @else if (error()) {
            <app-empty-state
              icon="info"
              title="Post not found"
              description="This post is unavailable, may have been deleted, or privacy settings prevent viewing."
              actionLabel="Return to feed"
              actionRoute="/"
            />
          } @else if (post.currentPost(); as value) {
            <!-- Post Card & Comment Section -->
            <div class="space-y-6">
              <app-post-card [post]="value" [showComments]="false" />

              <section class="rounded-2xl border border-border-subtle bg-surface-card p-5 sm:p-6 shadow-card">
                <h2 class="text-base font-bold text-content-primary border-b border-border-subtle pb-4">
                  Discussion & Replies
                </h2>
                <div class="mt-4">
                  <app-comment-section [postId]="value.id" />
                </div>
              </section>
            </div>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class PostPageComponent {
  readonly post = inject(PostService);
  private readonly auth = inject(AuthService);
  readonly error = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.error.set(true);
      return;
    }
    this.post.getPost(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.error.set(true),
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
