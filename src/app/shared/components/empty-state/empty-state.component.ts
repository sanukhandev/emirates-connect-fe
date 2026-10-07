import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-card px-6 py-12 text-center shadow-card sm:py-16">
      <!-- Icon Container -->
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 shadow-xs">
        @switch (icon()) {
          @case ('search') {
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
          @case ('users') {
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          @case ('post') {
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          @case ('bell') {
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          @default {
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        }
      </div>

      <!-- Title & Description -->
      <h3 class="mt-4 text-base font-bold text-content-primary sm:text-lg">{{ title() }}</h3>
      @if (description()) {
        <p class="mt-1.5 max-w-sm text-xs text-content-secondary leading-relaxed sm:text-sm">
          {{ description() }}
        </p>
      }

      <!-- Optional Action Button -->
      @if (actionLabel()) {
        <div class="mt-6">
          @if (actionRoute()) {
            <a
              [routerLink]="actionRoute()!"
              class="ec-btn-primary"
            >
              {{ actionLabel() }}
            </a>
          } @else {
            <button
              type="button"
              (click)="actionClick.emit()"
              class="ec-btn-primary"
            >
              {{ actionLabel() }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly icon = input<'search' | 'users' | 'post' | 'bell' | 'info'>('info');
  readonly actionLabel = input<string | null>(null);
  readonly actionRoute = input<string | null>(null);
  readonly actionClick = output<void>();
}
