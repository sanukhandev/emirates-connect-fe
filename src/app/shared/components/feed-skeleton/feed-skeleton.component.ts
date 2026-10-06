import { Component } from '@angular/core';

@Component({
  selector: 'app-feed-skeleton',
  template: `
    <div class="space-y-4" aria-label="Loading feed posts" aria-live="polite">
      @for (i of [1, 2]; track i) {
        <article class="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card">
          <!-- Header skeleton -->
          <div class="flex items-center gap-3">
            <div class="h-11 w-11 animate-pulse rounded-full bg-surface-secondary"></div>
            <div class="space-y-2 flex-1">
              <div class="h-4 w-36 animate-pulse rounded-md bg-surface-secondary"></div>
              <div class="h-3 w-24 animate-pulse rounded-md bg-surface-secondary"></div>
            </div>
          </div>

          <!-- Body skeleton -->
          <div class="mt-4 space-y-2.5">
            <div class="h-3.5 w-full animate-pulse rounded-md bg-surface-secondary"></div>
            <div class="h-3.5 w-5/6 animate-pulse rounded-md bg-surface-secondary"></div>
            <div class="h-3.5 w-3/4 animate-pulse rounded-md bg-surface-secondary"></div>
          </div>

          <!-- Media placeholder -->
          <div class="mt-4 h-48 w-full animate-pulse rounded-xl bg-surface-secondary"></div>

          <!-- Footer action skeleton -->
          <div class="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
            <div class="h-3 w-28 animate-pulse rounded-md bg-surface-secondary"></div>
            <div class="flex gap-4">
              <div class="h-7 w-16 animate-pulse rounded-lg bg-surface-secondary"></div>
              <div class="h-7 w-16 animate-pulse rounded-lg bg-surface-secondary"></div>
            </div>
          </div>
        </article>
      }
    </div>
  `,
})
export class FeedSkeletonComponent {}
