import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-mobile-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-border-subtle bg-surface-card/95 px-2 backdrop-blur-md md:hidden"
      aria-label="Mobile Bottom Navigation"
    >
      <!-- Home -->
      <a
        routerLink="/"
        routerLinkActive="text-brand-600 font-semibold"
        [routerLinkActiveOptions]="{ exact: true }"
        class="flex flex-col items-center gap-1 py-1 text-content-secondary transition-colors focus-visible:outline-none"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span class="text-[10px]">Home</span>
      </a>

      <!-- Discover -->
      <a
        routerLink="/search"
        routerLinkActive="text-brand-600 font-semibold"
        class="flex flex-col items-center gap-1 py-1 text-content-secondary transition-colors focus-visible:outline-none"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
        <span class="text-[10px]">Discover</span>
      </a>

      <!-- Center Action: Create (+) -->
      <button
        type="button"
        (click)="createPost.emit()"
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs transition-transform active:scale-95 focus-visible:outline-none"
        aria-label="Create new post"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <!-- Network / Businesses -->
      <a
        routerLink="/businesses"
        routerLinkActive="text-brand-600 font-semibold"
        class="flex flex-col items-center gap-1 py-1 text-content-secondary transition-colors focus-visible:outline-none"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span class="text-[10px]">Network</span>
      </a>

      <!-- Profile -->
      <a
        routerLink="/profile"
        routerLinkActive="text-brand-600 font-semibold"
        class="flex flex-col items-center gap-1 py-1 text-content-secondary transition-colors focus-visible:outline-none"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span class="text-[10px]">Profile</span>
      </a>
    </nav>
  `,
})
export class MobileBottomNavComponent {
  readonly createPost = output<void>();
}
