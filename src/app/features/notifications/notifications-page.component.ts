import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/notification/notification.service';
import { notificationMessage, notificationRoute } from '../../core/notification/notification-copy';
import { Notification, NotificationActor } from '../../core/notification/notification.models';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notifications-page',
  imports: [
    DatePipe,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Sticky Header -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar (240px) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[840px] shrink min-w-0 space-y-6 pb-20 md:pb-10">

          <!-- Page Header & Filtering Card -->
          <header class="rounded-2xl border border-border-subtle bg-surface-card p-5 sm:p-6 shadow-card">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Activity</p>
                <h1 class="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                  Notifications
                </h1>
                <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                  Stay close to conversations, milestone updates, and connections that matter.
                </p>
              </div>

              <!-- Quick Action: Mark All As Read -->
              @if (notifications.unreadCount() > 0) {
                <button
                  type="button"
                  class="ec-btn-secondary px-3.5 py-2 text-xs"
                  (click)="markAll()"
                  [disabled]="markingAll()"
                >
                  <svg class="h-4 w-4 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{{ markingAll() ? 'Marking…' : 'Mark all as read' }}</span>
                </button>
              }
            </div>

            <!-- Filter Tabs -->
            <div class="mt-5 flex items-center gap-2 border-t border-border-subtle pt-4">
              <button
                type="button"
                (click)="setFilter(false)"
                class="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all"
                [class.bg-brand-50]="!unreadOnly()"
                [class.text-brand-700]="!unreadOnly()"
                [class.text-content-secondary]="unreadOnly()"
                [class.hover:bg-surface-secondary]="unreadOnly()"
              >
                All
              </button>
              <button
                type="button"
                (click)="setFilter(true)"
                class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all"
                [class.bg-brand-50]="unreadOnly()"
                [class.text-brand-700]="unreadOnly()"
                [class.text-content-secondary]="!unreadOnly()"
                [class.hover:bg-surface-secondary]="!unreadOnly()"
              >
                <span>Unread</span>
                @if (notifications.unreadCount() > 0) {
                  <span class="rounded-full bg-brand-primary px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {{ notifications.unreadCount() }}
                  </span>
                }
              </button>
            </div>
          </header>

          <!-- Error Alert -->
          @if (actionError(); as error) {
            <p class="rounded-xl border border-status-danger/30 bg-status-danger/10 p-3.5 text-xs sm:text-sm font-medium text-status-danger" role="alert">
              {{ error }}
            </p>
          }

          <!-- Loading Shimmer -->
          @if (notifications.loading()) {
            <div class="space-y-3" aria-label="Loading notifications" aria-live="polite">
              @for (item of [1, 2, 3, 4]; track item) {
                <div class="h-20 animate-pulse rounded-2xl bg-surface-muted"></div>
              }
            </div>
          } @else if (notifications.error(); as error) {
            <app-empty-state
              icon="info"
              title="Unable to load notifications"
              [description]="error"
              actionLabel="Retry"
              (actionClick)="retry()"
            />
          } @else if (!notifications.notifications().length) {
            <app-empty-state
              icon="bell"
              [title]="unreadOnly() ? 'You’re all caught up' : 'No notifications yet'"
              [description]="unreadOnly() ? 'No unread notifications at the moment. Check the All tab for earlier updates.' : 'When professionals interact with your profile or posts, updates will appear here.'"
            />
          } @else {
            <!-- LINEAR NOTIFICATIONS STREAM (Threads / Minimal style) -->
            <section class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card divide-y divide-border-subtle" aria-label="Notifications stream">
              @for (item of notifications.notifications(); track item.id) {
                <button
                  type="button"
                  (click)="open(item)"
                  class="flex w-full items-start gap-3.5 p-4 sm:p-5 text-left transition-colors hover:bg-surface-secondary/40 focus-visible:outline-none focus-visible:bg-surface-secondary/60"
                  [class.bg-brand-50/25]="!item.read_at"
                >
                  <!-- Actor Avatar / Logo -->
                  <div class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 font-bold text-brand-700 shadow-xs">
                    @if (actorImage(item.actor); as image) {
                      <img [src]="image" [alt]="actorName(item.actor)" class="h-full w-full object-cover" />
                    } @else {
                      {{ initials(actorName(item.actor)) }}
                    }
                  </div>

                  <!-- Content Area -->
                  <div class="min-w-0 flex-1">
                    <p class="break-words text-xs sm:text-sm text-content-primary leading-relaxed" [class.font-semibold]="!item.read_at">
                      {{ message(item) }}
                    </p>
                    <time class="mt-1 block text-[11px] font-medium text-content-muted" [attr.datetime]="item.created_at">
                      {{ item.created_at | date:'medium' }}
                    </time>
                  </div>

                  <!-- Purple Unread Indicator Dot -->
                  @if (!item.read_at) {
                    <span
                      class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-primary ring-4 ring-brand-100"
                      aria-label="Unread notification"
                    ></span>
                  }
                </button>
              }
            </section>
          }

          <!-- Pagination / Load More -->
          @if (notifications.hasMore() && !notifications.loading()) {
            <div class="text-center pt-2">
              <button
                type="button"
                class="ec-btn-secondary px-5 py-2.5"
                (click)="notifications.loadMore(unreadOnly())"
                [disabled]="notifications.loadingMore()"
              >
                {{ notifications.loadingMore() ? 'Loading more updates…' : 'Load more notifications' }}
              </button>
            </div>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class NotificationsPageComponent {
  readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  readonly unreadOnly = signal(false);
  readonly markingAll = signal(false);
  readonly actionError = signal<string | null>(null);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const unread = params.get('unread') === 'true';
      this.unreadOnly.set(unread);
      this.notifications.loadInitial(unread);
    });
  }

  logout(): void {
    this.auth.logout();
  }

  setFilter(unread: boolean): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { unread: unread ? 'true' : null } });
  }

  retry(): void {
    this.notifications.loadInitial(this.unreadOnly());
  }

  markAll(): void {
    if (this.markingAll()) return;
    this.actionError.set(null);
    this.markingAll.set(true);
    this.notifications.markAllRead().subscribe({
      error: () => {
        this.actionError.set('Unable to mark notifications as read.');
        this.markingAll.set(false);
      },
      complete: () => {
        if (this.unreadOnly()) this.notifications.loadInitial(true);
        this.markingAll.set(false);
      },
    });
  }

  open(notification: Notification): void {
    this.actionError.set(null);
    this.notifications.markRead(notification).subscribe({
      error: () => this.actionError.set('Unable to save the read state.'),
    });
    const route = notificationRoute(notification);
    if (route) void this.router.navigate(route);
  }

  message(notification: Notification): string {
    return notificationMessage(notification);
  }

  actorName(actor: NotificationActor): string {
    return actor?.type === 'user' ? (actor.display_name || 'Someone') : actor?.type === 'business' ? actor.name : 'Emirates Connect';
  }

  actorImage(actor: NotificationActor): string | null {
    return actor?.type === 'user' ? actor.avatar_url : actor?.type === 'business' ? actor.logo_url : null;
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
