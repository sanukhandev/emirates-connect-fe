import { Component, input } from '@angular/core';

@Component({
  selector: 'app-verification-badge',
  template: `
    <span
      class="group relative inline-flex items-center justify-center align-middle focus-visible:outline-none"
      [attr.aria-label]="label()"
      tabindex="0"
    >
      @if (type() === 'business') {
        <!-- Verified Business: Octagonal / faceted shield with gold-purple tint -->
        <span
          class="inline-flex h-4 w-4 items-center justify-center rounded-md bg-brand-500 text-white shadow-xs transition-transform group-hover:scale-110"
        >
          <svg class="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 1L7.54 2.27L9.5 2.5L10 4.41L11.27 5.95L10.5 7.77L10.73 9.73L8.82 10.23L7.28 11.5L6 10.73L4.72 11.5L3.18 10.23L1.27 9.73L1.5 7.77L0.73 5.95L2 4.41L2.5 2.5L4.46 2.27L6 1Z"
              fill="currentColor"
            />
            <path
              d="M4 6L5.3 7.3L8 4.6"
              stroke="#FFFFFF"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      } @else {
        <!-- Verified Professional: Sleek circular check with lavender ring -->
        <span
          class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white shadow-xs transition-transform group-hover:scale-110"
        >
          <svg class="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.75 6.25L5.25 7.75L8.25 4.75"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      }

      <!-- Accessible Tooltip -->
      <span
        role="tooltip"
        class="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-content-primary px-2 py-1 text-[11px] font-medium tracking-tight text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {{ label() }}
      </span>
    </span>
  `,
})
export class VerificationBadgeComponent {
  readonly type = input<'professional' | 'business'>('professional');

  label(): string {
    return this.type() === 'business' ? 'Verified Business' : 'Verified Professional';
  }
}
