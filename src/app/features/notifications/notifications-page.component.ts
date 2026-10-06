import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationService } from '../../core/notification/notification.service';
import { notificationMessage, notificationRoute } from '../../core/notification/notification-copy';
import { Notification, NotificationActor } from '../../core/notification/notification.models';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, NotificationBellComponent],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div><p class="text-sm font-medium uppercase tracking-[0.18em] text-brand-strong">Emirates Connect</p><h1 class="mt-2 text-3xl font-bold tracking-tight">Notifications</h1><p class="mt-1 text-content-secondary">Stay close to the conversations and milestones that matter.</p></div>
          <div class="flex items-center gap-2"><app-notification-bell />@if (notifications.unreadCount() > 0) { <button type="button" class="rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" (click)="markAll()" [disabled]="markingAll()">{{ markingAll() ? 'Marking…' : 'Mark all as read' }}</button> }</div>
        </header>

        <nav class="mt-6 flex gap-2" aria-label="Notification filter"><button type="button" class="rounded-xl px-4 py-2 text-sm font-medium" [class.bg-brand-primary]="!unreadOnly()" [class.text-white]="!unreadOnly()" [class.bg-surface-card]="unreadOnly()" (click)="setFilter(false)">All</button><button type="button" class="rounded-xl px-4 py-2 text-sm font-medium" [class.bg-brand-primary]="unreadOnly()" [class.text-white]="unreadOnly()" [class.bg-surface-card]="!unreadOnly()" (click)="setFilter(true)">Unread</button></nav>
        @if (actionError(); as error) { <p class="mt-4 rounded-2xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger" role="alert">{{ error }}</p> }
        @if (notifications.error(); as error) { <section class="mt-6 rounded-3xl bg-surface-card p-8 text-center shadow-card" role="alert"><p class="text-status-danger">{{ error }}</p><button type="button" class="mt-4 rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white" (click)="retry()">Retry</button></section> }
        @if (notifications.loading()) { <div class="mt-6 space-y-3" aria-label="Loading notifications" aria-live="polite"><div class="h-20 animate-pulse rounded-2xl bg-surface-muted"></div><div class="h-20 animate-pulse rounded-2xl bg-surface-muted"></div><div class="h-20 animate-pulse rounded-2xl bg-surface-muted"></div></div> }
        @else if (!notifications.error() && !notifications.notifications().length) { <section class="mt-6 rounded-3xl bg-surface-card p-8 text-center shadow-card"><h2 class="text-xl font-bold">{{ unreadOnly() ? 'You’re all caught up.' : 'No notifications yet.' }}</h2><p class="mt-2 text-content-secondary">{{ unreadOnly() ? 'New activity will appear here.' : 'Your activity updates will appear here.' }}</p></section> }
        @else { <section class="mt-6 space-y-3" aria-label="Notifications">@for (item of notifications.notifications(); track item.id) { <button type="button" class="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" [class.border-brand-primary/30]="!item.read_at" [class.bg-brand-soft/30]="!item.read_at" [class.border-border-subtle]="!!item.read_at" [class.bg-surface-card]="!!item.read_at" (click)="open(item)"><span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (actorImage(item.actor); as image) { <img [src]="image" [alt]="actorName(item.actor)" class="h-full w-full object-cover" /> } @else { {{ initials(actorName(item.actor)) }} }</span><span class="min-w-0 flex-1"><span class="block break-words text-sm leading-6" [class.font-semibold]="!item.read_at">{{ message(item) }}</span><time class="mt-1 block text-xs text-content-muted" [attr.datetime]="item.created_at">{{ item.created_at | date:'medium' }}</time></span>@if (!item.read_at) { <span class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-primary" aria-label="Unread"></span> }</button> }</section> }
        @if (notifications.loadMoreError(); as error) { <section class="mt-4 rounded-2xl bg-surface-card p-4 text-center" role="alert"><p class="text-sm text-status-danger">{{ error }}</p><button type="button" class="mt-3 rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium" (click)="notifications.loadMore(unreadOnly())">Retry</button></section> }
        @if (notifications.loadingMore()) { <p class="py-4 text-center text-sm text-content-muted" aria-live="polite">Loading more notifications…</p> }
        @if (notifications.hasMore()) { <button type="button" class="mt-4 w-full rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-sm font-medium hover:border-brand-primary disabled:opacity-50" (click)="notifications.loadMore(unreadOnly())" [disabled]="notifications.loadingMore()">Load more</button> }
      </div>
    </main>
  `,
})
export class NotificationsPageComponent {
  readonly notifications = inject(NotificationService);
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

  setFilter(unread: boolean): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { unread: unread ? 'true' : null } });
  }

  retry(): void { this.notifications.loadInitial(this.unreadOnly()); }

  markAll(): void {
    if (this.markingAll()) return;
    this.actionError.set(null);
    this.markingAll.set(true);
    this.notifications.markAllRead().subscribe({
      error: () => { this.actionError.set('Unable to mark notifications as read.'); this.markingAll.set(false); },
      complete: () => {
        if (this.unreadOnly()) this.notifications.loadInitial(true);
        this.markingAll.set(false);
      },
    });
  }

  open(notification: Notification): void {
    this.actionError.set(null);
    this.notifications.markRead(notification).subscribe({ error: () => this.actionError.set('Unable to save the read state.') });
    const route = notificationRoute(notification);
    if (route) void this.router.navigate(route);
  }

  message(notification: Notification): string { return notificationMessage(notification); }
  actorName(actor: NotificationActor): string { return actor?.type === 'user' ? (actor.display_name || 'Someone') : actor?.type === 'business' ? actor.name : 'Emirates Connect'; }
  actorImage(actor: NotificationActor): string | null { return actor?.type === 'user' ? actor.avatar_url : actor?.type === 'business' ? actor.logo_url : null; }
  initials(name: string): string { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
}
