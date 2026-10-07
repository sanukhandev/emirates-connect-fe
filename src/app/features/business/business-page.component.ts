import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { FollowState } from '../../core/follow/follow.models';
import { BusinessService } from '../../core/business/business.service';
import { canEditBusiness } from '../../core/business/business.permissions';
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
  selector: 'app-business-page',
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
        <!-- 1. Left Desktop Sidebar (sticky, 240-256px) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[960px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Top Application Header -->
          <app-header createLabel="Create" createRoute="/businesses/create" />

          <!-- Loading Shimmer State -->
          @if (business.isLoading()) {
            <div class="space-y-4">
              <div class="h-64 animate-pulse rounded-3xl bg-surface-muted"></div>
              <div class="h-44 animate-pulse rounded-3xl bg-surface-muted"></div>
            </div>
          } @else if (error()) {
            <!-- Business Not Found -->
            <app-empty-state
              icon="info"
              title="Business not found"
              description="This business profile is unavailable or may have been removed."
              actionLabel="Explore businesses"
              actionRoute="/businesses"
            />
          } @else if (business.currentBusiness(); as value) {
            <!-- HERO BUSINESS PROFILE CARD -->
            <section class="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-card">
              <!-- Cover Banner -->
              <div class="relative h-44 sm:h-60 w-full bg-brand-50 overflow-hidden">
                @if (value.cover_image_url && !coverError()) {
                  <img
                    [src]="value.cover_image_url"
                    alt="Cover image"
                    class="h-full w-full object-cover"
                    (error)="coverError.set(true)"
                  />
                } @else {
                  <div class="h-full w-full bg-linear-to-r from-brand-100/90 via-brand-50 to-surface-secondary flex items-center justify-end pr-8">
                    <svg class="h-32 w-32 text-brand-200/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="1.5" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                  </div>
                }
              </div>

              <!-- Content Area -->
              <div class="px-5 pb-7 sm:px-8">
                <!-- Logo & Action Row -->
                <div class="flex flex-wrap items-end justify-between gap-4 -mt-14 sm:-mt-16">
                  <!-- Business Logo (Unclipped) -->
                  <div class="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl border-4 border-surface-card bg-brand-50 font-bold text-brand-700 shadow-card">
                    @if (value.logo_url && !logoError()) {
                      <img
                        [src]="value.logo_url"
                        [alt]="value.name + ' logo'"
                        class="h-full w-full object-cover"
                        (error)="logoError.set(true)"
                      />
                    } @else {
                      <span class="text-2xl sm:text-3xl font-bold">
                        {{ initials(value.name) }}
                      </span>
                    }
                  </div>

                  <!-- Action Controls -->
                  <div class="flex flex-wrap items-center gap-2.5">
                    @if (value.status === 'active') {
                      <app-follow-control
                        targetType="business"
                        [targetId]="value.id"
                        [targetSlug]="value.slug"
                        [targetLabel]="value.name"
                        [isFollowing]="value.is_following ?? false"
                        [followersCount]="value.followers_count ?? 0"
                        (stateChange)="updateFollow($event)"
                      />

                      @if (!canEdit(value.current_user_role)) {
                        <button
                          type="button"
                          class="ec-btn-secondary px-3 py-2 text-xs"
                          (click)="openReport('business', value.id, value.name)"
                          title="Report this business"
                        >
                          <svg class="h-4 w-4 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                          </svg>
                          <span>Report</span>
                        </button>
                      }
                    }

                    <!-- Management Actions (For Admins / Owners) -->
                    @if (canEdit(value.current_user_role)) {
                      @if (!value.is_verified) {
                        <a
                          [routerLink]="['/businesses', value.slug, 'verification']"
                          class="ec-btn-primary px-3.5 py-2 text-xs"
                        >
                          Verify business
                        </a>
                      }
                      <a
                        [routerLink]="['/businesses', value.slug, 'edit']"
                        class="ec-btn-secondary px-3 py-2 text-xs"
                      >
                        Edit
                      </a>
                      <a
                        [routerLink]="['/businesses', value.slug, 'members']"
                        class="ec-btn-secondary px-3 py-2 text-xs"
                      >
                        Members
                      </a>
                    }
                  </div>
                </div>

                <!-- Business Name, Handle & Tagline -->
                <div class="mt-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                      {{ value.name }}
                    </h1>
                    @if (value.is_verified) {
                      <app-verification-badge type="business" />
                    }
                    <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">Business</span>
                  </div>

                  <!-- b/slug handle convention -->
                  <p class="text-xs sm:text-sm font-semibold text-brand-600 mt-0.5">
                    b/{{ value.slug }}
                  </p>

                  @if (value.tagline) {
                    <p class="mt-2 text-base text-content-secondary leading-relaxed">
                      {{ value.tagline }}
                    </p>
                  }

                  <!-- Meta Chips -->
                  <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-content-secondary">
                    @if (value.emirate) {
                      <span class="inline-flex items-center gap-1.5 rounded-lg bg-surface-secondary px-2.5 py-1 font-medium">
                        <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        {{ value.emirate | titlecase }}, UAE
                      </span>
                    }

                    @if (value.industry) {
                      <span class="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                        {{ value.industry | titlecase }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Followers Bar -->
                <div class="mt-5 flex flex-wrap gap-3 border-t border-border-subtle pt-4 text-xs sm:text-sm">
                  <a
                    [routerLink]="['/businesses', value.slug, 'followers']"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-card px-3.5 py-2 font-semibold text-content-primary transition hover:border-brand-primary hover:text-brand-primary shadow-xs"
                  >
                    <span>{{ value.followers_count ?? 0 }}</span>
                    <span class="font-normal text-content-secondary">followers</span>
                  </a>
                </div>

                <!-- Bento Info Grid: About & Contact -->
                <div class="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                  <!-- About Card -->
                  <article class="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card">
                    <h2 class="text-sm font-bold text-content-primary">About Business</h2>
                    <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-content-secondary">
                      {{ value.description || 'No business description added yet.' }}
                    </p>
                  </article>

                  <!-- Contact Card -->
                  <article class="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card">
                    <h2 class="text-sm font-bold text-content-primary">Contact & Presence</h2>
                    <dl class="mt-3 space-y-3 text-xs sm:text-sm">
                      @if (safeUrl(value.website_url); as website) {
                        <div>
                          <dt class="text-[11px] font-semibold uppercase tracking-wider text-content-muted">Website</dt>
                          <dd class="mt-0.5">
                            <a [href]="website" target="_blank" rel="noopener noreferrer" class="break-all font-medium text-brand-primary hover:underline">
                              {{ website }}
                            </a>
                          </dd>
                        </div>
                      }

                      @if (value.email) {
                        <div>
                          <dt class="text-[11px] font-semibold uppercase tracking-wider text-content-muted">Email</dt>
                          <dd class="mt-0.5">
                            <a [href]="'mailto:' + value.email" class="break-all font-medium text-brand-primary hover:underline">
                              {{ value.email }}
                            </a>
                          </dd>
                        </div>
                      }

                      @if (value.phone) {
                        <div>
                          <dt class="text-[11px] font-semibold uppercase tracking-wider text-content-muted">Phone</dt>
                          <dd class="mt-0.5">
                            <a [href]="'tel:' + value.phone" class="font-medium text-brand-primary hover:underline">
                              {{ value.phone }}
                            </a>
                          </dd>
                        </div>
                      }

                      @if (!value.website_url && !value.email && !value.phone) {
                        <p class="text-xs text-content-muted">No public contact channels added.</p>
                      }
                    </dl>
                  </article>
                </div>
              </div>
            </section>

            <!-- Latest Business Updates Section -->
            <section class="space-y-4" aria-label="Latest updates">
              <div class="flex items-center justify-between pb-1">
                <h2 class="text-lg font-bold text-content-primary">Latest updates</h2>
                @if (posts.businessPosts().length) {
                  <span class="text-xs font-semibold text-content-muted">{{ posts.businessPosts().length }} published</span>
                }
              </div>

              @if (posts.businessPosts().length) {
                <div class="space-y-4">
                  @for (item of posts.businessPosts(); track item.id) {
                    <app-post-card [post]="item" />
                  }
                </div>
              } @else {
                <app-empty-state
                  icon="post"
                  title="No updates published yet"
                  description="Updates and business announcements published by this page will appear here."
                />
              }
            </section>
          }

          <!-- Toast Feedback -->
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

    <!-- Report Dialog -->
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
export class BusinessPageComponent {
  readonly business = inject(BusinessService);
  readonly posts = inject(PostService);
  private readonly auth = inject(AuthService);
  readonly error = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly reportTarget = signal<{ type: ReportTargetType; id: number; label: string } | null>(null);
  readonly message = signal('');

  readonly logoError = signal(false);
  readonly coverError = signal(false);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set(true);
      return;
    }
    this.business.getBusiness(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.posts.getBusinessPosts(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(),
      error: () => this.error.set(true),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  canEdit = canEditBusiness;

  updateFollow(state: FollowState): void {
    this.business.currentBusiness.update((business) =>
      business ? { ...business, is_following: state.isFollowing, followers_count: state.followersCount } : business
    );
  }

  initials(name: string): string {
    return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  openReport(type: ReportTargetType, id: number, label: string): void {
    this.reportTarget.set({ type, id, label });
  }

  closeReport(result: 'submitted' | 'cancelled'): void {
    this.reportTarget.set(null);
    if (result === 'submitted') this.message.set('Report submitted.');
  }

  safeUrl(value: string | null): string | null {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
}
