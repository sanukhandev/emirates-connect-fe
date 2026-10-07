import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-top-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 border-b border-border-subtle bg-surface-card/95 shadow-xs backdrop-blur-md">
      <div class="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a routerLink="/" class="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label="Emirates Connect home">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-xs">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2L19.5 6.33V15L12 19.33L4.5 15V6.33L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="12" cy="10.66" r="3" fill="currentColor" />
            </svg>
          </span>
          <span class="hidden text-sm font-bold tracking-tight text-content-primary sm:inline">Emirates Connect</span>
        </a>

        <form class="min-w-0 flex-1 md:max-w-md" (submit)="search($event)" role="search">
          <label for="global-navigation-search" class="sr-only">Search people, businesses and posts</label>
          <div class="relative">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input id="global-navigation-search" type="search" [value]="query()" (input)="query.set(inputValue($event))" placeholder="Search people, businesses and posts" class="w-full rounded-xl border border-border-subtle bg-surface-secondary py-2.5 pl-9 pr-3 text-xs text-content-primary outline-none transition focus:border-brand-primary focus:bg-surface-card focus:ring-4 focus:ring-brand-primary/10 sm:text-sm" />
          </div>
        </form>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Quick menu">
          @for (item of quickLinks; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-brand-soft text-brand-strong" [routerLinkActiveOptions]="{ exact: item.path === '/' }" class="rounded-xl px-3 py-2 text-xs font-semibold text-content-secondary transition hover:bg-surface-secondary hover:text-content-primary">{{ item.label }}</a>
          }
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <a routerLink="/profile/edit" class="hidden h-10 items-center gap-2 rounded-xl border border-border-subtle px-3 text-xs font-semibold text-content-secondary transition hover:border-brand-primary hover:text-content-primary sm:inline-flex" aria-label="Profile settings">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06A1.7 1.7 0 0 0 11.64 6H12V4h2.4v.2A1.7 1.7 0 0 0 15.43 5.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 18.67 9c.2.6.76 1 1.4 1H21v2.4h-.93A1.7 1.7 0 0 0 18.67 15Z" /></svg>
            <span>Settings</span>
          </a>
          <a routerLink="/profile" class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand-soft text-sm font-bold text-brand-strong ring-1 ring-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label="Open profile">
            @if (avatar(); as url) { <img [src]="url" alt="" class="h-full w-full object-cover" /> } @else { {{ initials() }} }
          </a>
        </div>
      </div>
    </header>
  `,
})
export class TopNavComponent {
  readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);
  readonly query = signal('');
  readonly quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Discover', path: '/search' },
    { label: 'Businesses', path: '/businesses' },
    { label: 'Reels', path: '/reels' },
    { label: 'Notifications', path: '/notifications' },
  ];

  avatar(): string | null { return this.auth.currentUser()?.profile?.avatar_url ?? null; }
  initials(): string { return (this.auth.currentUser()?.profile?.display_name || this.auth.currentUser()?.name || 'EC').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
  inputValue(event: Event): string { return event.target instanceof HTMLInputElement ? event.target.value : ''; }
  search(event: Event): void { event.preventDefault(); const query = this.query().trim(); if (query) void this.router.navigate(['/search'], { queryParams: { q: query } }); }
}
