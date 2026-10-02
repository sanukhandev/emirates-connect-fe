import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthStateService } from '../../core/auth/auth-state.service';
import { NotificationService } from '../../core/notification/notification.service';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink],
  template: `
    @if (auth.isAuthenticated()) {
      <a routerLink="/notifications" class="relative inline-flex min-h-11 items-center rounded-xl border border-border-subtle bg-surface-card px-3 py-2 text-sm font-medium hover:border-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" [attr.aria-label]="label()">
        <svg aria-hidden="true" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 4.02-1.2c-1.07-1.24-1.71-2.85-1.71-4.61V9.75a5.167 5.167 0 0 0-10.334 0v1.522c0 1.76-.64 3.37-1.71 4.61a23.848 23.848 0 0 0 4.02 1.2m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
        <span class="sr-only">Notifications</span>
        @if (notifications.unreadCount() > 0) { <span class="absolute -right-2 -top-2 min-w-5 rounded-full bg-brand-primary px-1.5 py-0.5 text-center text-[0.65rem] font-bold leading-4 text-white">{{ badge() }}</span> }
      </a>
    }
  `,
})
export class NotificationBellComponent {
  readonly auth = inject(AuthStateService);
  readonly notifications = inject(NotificationService);

  label(): string { return this.notifications.unreadCount() ? `Notifications, ${this.notifications.unreadCount()} unread` : 'Notifications'; }
  badge(): string { return this.notifications.unreadCount() > 99 ? '99+' : String(this.notifications.unreadCount()); }
}
