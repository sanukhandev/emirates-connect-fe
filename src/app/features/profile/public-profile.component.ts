import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { FollowState } from '../../core/follow/follow.models';
import { ProfileService } from '../../core/profile/profile.service';
import { PublicUser } from '../../core/profile/profile.models';
import { PostService } from '../../core/post/post.service';
import { FollowControlComponent } from '../../shared/components/follow-control.component';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { ReportDialogComponent } from '../../shared/components/report-dialog.component';
import { ReportTargetType } from '../../core/report/report.models';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { VerificationBadgeComponent } from '../../shared/components/verification-badge/verification-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-public-profile',
  imports: [
    RouterLink,
    TitleCasePipe,
    FollowControlComponent,
    PostCardComponent,
    ReportDialogComponent,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    AppHeaderComponent,
    VerificationBadgeComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Desktop Sidebar (sticky, 240-256px) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[920px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Top Application Header -->
          <app-header />

          <!-- Loading Shimmer State -->
          @if (loading()) {
            <div class="space-y-4">
              <div class="h-64 animate-pulse rounded-3xl bg-surface-muted"></div>
              <div class="h-44 animate-pulse rounded-3xl bg-surface-muted"></div>
            </div>
          } @else if (error()) {
            <!-- Profile Unavailable -->
            <app-empty-state
              icon="info"
              title="Profile not found"
              description="This professional profile is unavailable or may have been deactivated."
              actionLabel="Return to feed"
              actionRoute="/"
            />
          } @else if (user(); as value) {
            <!-- HERO PROFILE CARD -->
            <section class="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-card">
              <!-- Cover Banner -->
              <div class="relative h-44 sm:h-56 w-full bg-brand-50 overflow-hidden">
                @if (value.profile.cover_image_url && !coverError()) {
                  <img
                    [src]="value.profile.cover_image_url"
                    alt="Cover banner"
                    class="h-full w-full object-cover"
                    (error)="coverError.set(true)"
                  />
                } @else {
                  <div class="h-full w-full bg-linear-to-r from-brand-100/80 via-brand-50 to-surface-secondary flex items-center justify-end pr-8">
                    <svg class="h-32 w-32 text-brand-200/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L19.5 6.33V15L12 19.33L4.5 15V6.33L12 2Z" stroke="currentColor" stroke-width="1.5" />
                      <circle cx="12" cy="10.66" r="3" fill="currentColor" />
                    </svg>
                  </div>
                }
              </div>

              <!-- Profile Details Area -->
              <div class="px-5 pb-7 sm:px-8">
                <!-- Avatar & Action Bar Row -->
                <div class="flex flex-wrap items-end justify-between gap-4 -mt-14 sm:-mt-16">
                  <!-- Unclipped Avatar -->
                  <div class="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border-4 border-surface-card bg-brand-100 font-bold text-brand-700 shadow-card">
                    @if (value.profile.avatar_url && !avatarError()) {
                      <img
                        [src]="value.profile.avatar_url"
                        [alt]="(value.profile.display_name || value.name) + ' profile photo'"
                        class="h-full w-full object-cover"
                        (error)="avatarError.set(true)"
                      />
                    } @else {
                      <span class="text-2xl sm:text-3xl font-bold">
                        {{ initials(value.profile.display_name || value.name) }}
                      </span>
                    }
                  </div>

                  <!-- Quick Action Buttons -->
                  @if (auth.currentUser()?.id !== value.id) {
                    <div class="flex flex-wrap items-center gap-2.5">
                      <app-follow-control
                        targetType="user"
                        [targetId]="value.id"
                        [targetLabel]="value.profile.display_name || value.name"
                        [isFollowing]="value.is_following"
                        [followersCount]="value.followers_count"
                        (stateChange)="updateFollow($event)"
                      />
                      <button
                        type="button"
                        class="ec-btn-secondary px-3 py-2 text-xs"
                        (click)="openReport('user', value.id, value.profile.display_name || value.name)"
                        title="Report this profile"
                        aria-label="Report this profile"
                      >
                        <svg class="h-4 w-4 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                        <span>Report</span>
                      </button>
                    </div>
                  }
                </div>

                <!-- Name, Handle & Headline -->
                <div class="mt-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                      {{ value.profile.display_name || value.name }}
                    </h1>
                    @if (value.is_verified) {
                      <app-verification-badge type="professional" />
                    }
                  </div>

                  <!-- e/handle identity -->
                  <p class="text-xs sm:text-sm font-semibold text-brand-600 mt-0.5">
                    {{ handle(value) }}
                  </p>

                  @if (value.profile.headline) {
                    <p class="mt-2 text-base text-content-secondary leading-relaxed">
                      {{ value.profile.headline }}
                    </p>
                  }

                  <!-- Professional Meta Badges -->
                  <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-content-secondary">
                    @if (value.profile.job_title) {
                      <span class="inline-flex items-center gap-1.5 rounded-lg bg-surface-secondary px-2.5 py-1 font-medium">
                        <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                        {{ value.profile.job_title }}@if (value.profile.company_name) { · {{ value.profile.company_name }} }
                      </span>
                    }

                    @if (value.profile.emirate) {
                      <span class="inline-flex items-center gap-1.5 rounded-lg bg-surface-secondary px-2.5 py-1 font-medium">
                        <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {{ value.profile.emirate | titlecase }}, UAE
                      </span>
                    }

                    @if (value.profile.industry) {
                      <span class="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                        {{ value.profile.industry | titlecase }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Follower Network Strip -->
                <div class="mt-5 flex flex-wrap gap-3 border-t border-border-subtle pt-4 text-xs sm:text-sm">
                  <a
                    [routerLink]="['/users', value.id, 'followers']"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-card px-3.5 py-2 font-semibold text-content-primary transition hover:border-brand-primary hover:text-brand-primary shadow-xs"
                  >
                    <span>{{ value.followers_count }}</span>
                    <span class="font-normal text-content-secondary">followers</span>
                  </a>
                  <a
                    [routerLink]="['/users', value.id, 'following']"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-card px-3.5 py-2 font-semibold text-content-primary transition hover:border-brand-primary hover:text-brand-primary shadow-xs"
                  >
                    <span>{{ value.following_count }}</span>
                    <span class="font-normal text-content-secondary">following</span>
                  </a>
                </div>

                <!-- Bento Cards: About & Professional Links -->
                <div class="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                  <article class="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card">
                    <h2 class="text-sm font-bold text-content-primary">About</h2>
                    <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-content-secondary">
                      {{ value.profile.bio || 'No professional introduction added yet.' }}
                    </p>
                  </article>

                  <article class="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card">
                    <h2 class="text-sm font-bold text-content-primary">Professional Links</h2>
                    <div class="mt-3 space-y-2.5 text-xs sm:text-sm">
                      @if (value.profile.website_url) {
                        <a
                          [href]="value.profile.website_url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-2 truncate text-brand-primary hover:underline"
                        >
                          <svg class="h-4 w-4 shrink-0 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" /></svg>
                          <span class="truncate">{{ value.profile.website_url }}</span>
                        </a>
                      }
                      @if (value.profile.linkedin_url) {
                        <a
                          [href]="value.profile.linkedin_url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-2 truncate text-brand-primary hover:underline"
                        >
                          <svg class="h-4 w-4 shrink-0 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                          <span class="truncate">{{ value.profile.linkedin_url }}</span>
                        </a>
                      }
                      @if (!value.profile.website_url && !value.profile.linkedin_url) {
                        <p class="text-xs text-content-muted">No external links verified.</p>
                      }
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <!-- User Posts Section -->
            <section class="space-y-4" aria-label="Posts by user">
              <div class="flex items-center justify-between pb-1">
                <h2 class="text-lg font-bold text-content-primary">Posts</h2>
                @if (posts.userPosts().length) {
                  <span class="text-xs font-semibold text-content-muted">{{ posts.userPosts().length }} published</span>
                }
              </div>

              @if (posts.userPosts().length) {
                <div class="space-y-4">
                  @for (item of posts.userPosts(); track item.id) {
                    <app-post-card [post]="item" />
                  }
                </div>
              } @else {
                <app-empty-state
                  icon="post"
                  title="No posts yet"
                  description="This professional has not published any updates to the Emirates Connect feed."
                />
              }
            </section>
          }

          <!-- Feedback Toast Message -->
          @if (message()) {
            <p class="rounded-xl border border-status-success/30 bg-status-success/10 p-3.5 text-xs sm:text-sm font-semibold text-status-success" role="status">
              {{ message() }}
            </p>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>

    <!-- Report Modal Dialog -->
    @if (reportTarget(); as target) {
      <app-report-dialog
        [targetType]="target.type"
        [targetId]="target.id"
        [targetLabel]="target.label"
        (closed)="closeReport($event)"
      />
    }
  `,
})
export class PublicProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  readonly auth = inject(AuthStateService);
  readonly user = signal<PublicUser | null>(null);
  readonly posts = inject(PostService);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly reportTarget = signal<{ type: ReportTargetType; id: number; label: string } | null>(null);
  readonly message = signal('');

  readonly avatarError = signal(false);
  readonly coverError = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }
    this.profileService.getPublicProfile(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
        this.posts.getUserPosts(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  updateFollow(state: FollowState): void {
    this.user.update((user) => user ? { ...user, is_following: state.isFollowing, followers_count: state.followersCount } : user);
  }

  handle(user: PublicUser): string {
    const clean = user.name.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user${user.id}`;
    return `e/${clean}`;
  }

  initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  openReport(type: ReportTargetType, id: number, label: string): void {
    this.reportTarget.set({ type, id, label });
  }

  closeReport(result: 'submitted' | 'cancelled'): void {
    this.reportTarget.set(null);
    if (result === 'submitted') this.message.set('Report submitted.');
  }
}
