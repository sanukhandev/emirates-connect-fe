import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-card lg:grid-cols-[1.05fr_0.95fr]">
        <aside class="hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-10 text-white lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
          <!-- Background Geometric Subtle Accent -->
          <div class="pointer-events-none absolute -bottom-16 -right-16 text-white/5">
            <svg class="h-96 w-96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L19.5 6.33V15L12 19.33L4.5 15V6.33L12 2Z" stroke="currentColor" stroke-width="1.5" />
              <circle cx="12" cy="10.66" r="3" fill="currentColor" />
            </svg>
          </div>

          <div class="relative z-10">
            <a routerLink="/" class="flex items-center gap-2.5 text-sm font-bold tracking-tight">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-xs">
                <svg class="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L19.5 6.33V15L12 19.33L4.5 15V6.33L12 2Z" stroke="currentColor" stroke-width="2" />
                  <circle cx="12" cy="10.66" r="3" fill="currentColor" />
                </svg>
              </span>
              <span>Emirates Connect</span>
            </a>
            <div class="mt-24 max-w-md">
              <p class="text-xs font-semibold uppercase tracking-wider text-white/70">The UAE Business Network</p>
              <h1 class="mt-3 text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
                Build relationships that move business forward.
              </h1>
              <p class="mt-5 text-base sm:text-lg leading-relaxed text-white/80">
                A focused space for founders, executives, SMEs, and verified enterprises across all seven Emirates.
              </p>
            </div>
          </div>
          <p class="relative z-10 text-xs text-white/60">Professional connections, thoughtfully built in the UAE.</p>
        </aside>
        <section class="flex items-center p-6 sm:p-10 lg:p-14">
          <div class="w-full max-w-md">
            <a routerLink="/" class="text-sm font-medium uppercase tracking-[0.18em] text-brand-strong lg:hidden">Emirates Connect</a>
            <p class="mt-8 text-sm font-medium text-brand-strong lg:mt-0">{{ eyebrow() }}</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{{ title() }}</h2>
            <p class="mt-3 text-base leading-7 text-content-secondary">{{ description() }}</p>
            <div class="mt-8">
              <ng-content />
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class AuthShellComponent {
  readonly eyebrow = input('Emirates Connect');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
