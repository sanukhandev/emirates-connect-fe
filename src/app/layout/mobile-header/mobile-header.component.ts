import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationBellComponent } from '../../shared/components/notification-bell.component';

@Component({
  selector: 'app-mobile-header',
  imports: [RouterLink, NotificationBellComponent],
  template: `
    <header
      class="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-surface-card/95 px-4 backdrop-blur-md md:hidden"
    >
      <!-- Logo Mark -->
      <a routerLink="/" class="flex items-center gap-2.5 focus-visible:outline-none">
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
          <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L19.5 6.33V15L12 19.33L4.5 15V6.33L12 2Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="12" cy="10.66" r="3" fill="currentColor" />
          </svg>
        </div>
        <span class="text-sm font-bold tracking-tight text-content-primary">Emirates Connect</span>
      </a>

      <!-- Quick Actions -->
      <div class="flex items-center gap-2">
        <a
          routerLink="/search"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary text-content-secondary hover:text-content-primary focus-visible:outline-none"
          aria-label="Search Emirates Connect"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </a>

        <app-notification-bell />
      </div>
    </header>
  `,
})
export class MobileHeaderComponent {}
