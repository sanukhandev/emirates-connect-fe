import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VerificationBadgeComponent } from '../verification-badge/verification-badge.component';

@Component({
  selector: 'app-user-identity',
  imports: [RouterLink, VerificationBadgeComponent],
  template: `
    <div class="flex items-center gap-3 min-w-0" [class.gap-4]="size() === 'lg'">
      <!-- Avatar / Logo -->
      <a
        [routerLink]="profileRoute()"
        class="relative shrink-0 overflow-hidden font-bold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        [class.h-9]="size() === 'sm'"
        [class.w-9]="size() === 'sm'"
        [class.h-11]="size() === 'md'"
        [class.w-11]="size() === 'md'"
        [class.h-14]="size() === 'lg'"
        [class.w-14]="size() === 'lg'"
        [class.rounded-full]="type() === 'user'"
        [class.rounded-xl]="type() === 'business'"
        [class.bg-brand-50]="!avatarUrl() || imgError()"
        [class.text-brand-700]="!avatarUrl() || imgError()"
        [class.border]="type() === 'business'"
        [class.border-border-subtle]="type() === 'business'"
        [attr.aria-label]="name() + (type() === 'business' ? ' business page' : ' profile')"
      >
        @if (avatarUrl() && !imgError()) {
          <img
            [src]="avatarUrl()!"
            [alt]="name()"
            class="h-full w-full object-cover"
            loading="lazy"
            (error)="onImgError()"
          />
        } @else {
          <span class="flex h-full w-full items-center justify-center text-xs font-bold" [class.text-sm]="size() === 'lg'">
            {{ initials() }}
          </span>
        }
      </a>

      <!-- Identity Metadata -->
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <a
            [routerLink]="profileRoute()"
            class="truncate font-bold text-content-primary hover:text-brand-primary transition-colors focus-visible:outline-none"
            [class.text-xs]="size() === 'sm'"
            [class.text-sm]="size() === 'md'"
            [class.text-base]="size() === 'lg'"
          >
            {{ name() }}
          </a>

          @if (isVerified()) {
            <app-verification-badge [type]="type() === 'business' ? 'business' : 'professional'" />
          }

          @if (type() === 'business') {
            <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">Business</span>
          }
        </div>

        <!-- Handle: e/username or b/slug -->
        <p class="truncate text-[11px] font-medium text-brand-strong/80 leading-tight mt-0.5">
          {{ handle() }}
        </p>

        <!-- Optional Subtitle / Headline -->
        @if (headline()) {
          <p class="truncate text-xs text-content-secondary leading-tight mt-0.5" [class.text-[11px]]="size() === 'sm'">
            {{ headline() }}
          </p>
        }
      </div>
    </div>
  `,
})
export class UserIdentityComponent {
  readonly name = input.required<string>();
  readonly username = input<string | null>(null);
  readonly avatarUrl = input<string | null>(null);
  readonly type = input<'user' | 'business'>('user');
  readonly isVerified = input<boolean>(false);
  readonly headline = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly routeOverride = input<string | null>(null);
  readonly id = input<number | null>(null);
  readonly slug = input<string | null>(null);

  readonly imgError = signal<boolean>(false);

  profileRoute(): string | (string | number)[] {
    if (this.routeOverride()) return this.routeOverride()!;
    if (this.type() === 'business') {
      return this.slug() ? ['/businesses', this.slug()!] : '/businesses';
    }
    return this.id() ? ['/users', this.id()!] : '/profile';
  }

  handle(): string {
    if (this.type() === 'business') {
      const slugVal = this.slug() || this.username() || this.cleanHandle(this.name());
      return `b/${slugVal}`;
    }
    const userVal = this.username() || this.cleanHandle(this.name());
    return `e/${userVal}`;
  }

  initials(): string {
    return this.name()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  onImgError(): void {
    this.imgError.set(true);
  }

  private cleanHandle(raw: string): string {
    return raw.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'member';
  }
}
