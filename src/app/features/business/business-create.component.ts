import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { Business } from '../../core/business/business.models';
import { BusinessFormComponent } from './business-form.component';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';

@Component({
  selector: 'app-business-create',
  imports: [
    BusinessFormComponent,
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Responsive Shell Container (max 1440px) -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Navigation Rail (240px, sticky, Businesses active) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[1080px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Breadcrumbs and Back Link -->
          <div class="flex items-center gap-2 text-sm text-content-secondary">
            <a routerLink="/businesses" class="inline-flex items-center gap-1.5 font-medium hover:text-brand-600 transition-colors">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Businesses
            </a>
            <span class="text-border-subtle">/</span>
            <span class="font-bold text-content-primary">Create Business</span>
          </div>

          <!-- Page Header -->
          <header class="space-y-1.5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Business Presence</p>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
              Create a business page
            </h1>
            <p class="text-sm text-content-secondary max-w-2xl">
              Build your professional presence, verify operations, and connect with the Emirates Connect ecosystem.
            </p>
          </header>

          <!-- Bento Card Wrapper -->
          <section aria-label="Business creation form" class="rounded-3xl border border-border-subtle bg-surface-card p-5 sm:p-8 shadow-card">
            <app-business-form submitLabel="Create business" [showPreview]="true" (saved)="created($event)" />
          </section>
        </main>
      </div>

      <!-- Mobile Bottom Navigation (<= 768px) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class BusinessCreateComponent {
  readonly auth = inject(AuthService);
  readonly profile = inject(ProfileService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  created(business: Business): void {
    void this.router.navigate(['/businesses', business.slug]);
  }

  logout(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  onGlobalSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value.trim();
    if (val) {
      void this.router.navigate(['/search'], { queryParams: { q: val } });
    }
  }

  initials(name: string): string {
    return (name || 'EC')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
