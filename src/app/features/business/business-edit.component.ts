import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../core/business/business.service';
import { Business } from '../../core/business/business.models';
import { canDeactivateBusiness, canEditBusiness } from '../../core/business/business.permissions';
import { BusinessFormComponent } from './business-form.component';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-business-edit',
  imports: [
    BusinessFormComponent,
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    AppHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[920px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Top Application Header -->
          <app-header />

          <!-- Loading Shimmer -->
          @if (business.isLoading() && !value()) {
            <div class="h-96 animate-pulse rounded-3xl bg-surface-muted"></div>
          } @else if (error()) {
            <app-empty-state
              icon="info"
              title="Business not found"
              [description]="error()"
              actionLabel="Return to businesses"
              actionRoute="/businesses"
            />
          } @else if (value(); as item) {
            @if (canEdit(item.current_user_role)) {
              <!-- Edit Settings Card -->
              <section class="rounded-3xl border border-border-subtle bg-surface-card p-5 sm:p-8 shadow-card">
                <!-- Header with Back Link -->
                <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-5">
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Business Management</p>
                    <h1 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                      Edit {{ item.name }}
                    </h1>
                    <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                      Update your brand profile, contact information, and public details.
                    </p>
                  </div>

                  <a
                    [routerLink]="['/businesses', slug]"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-secondary px-3.5 py-2 text-xs font-semibold text-content-primary transition hover:border-brand-primary/40 hover:text-brand-primary"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>View page</span>
                  </a>
                </div>

                <!-- Form Section -->
                <div class="mt-6">
                  <app-business-form
                    [existing]="item"
                    submitLabel="Save changes"
                    (saved)="saved($event)"
                  />
                </div>

                <!-- Business Media Bento Section -->
                <div class="mt-10 border-t border-border-subtle pt-6">
                  <h2 class="text-base font-bold text-content-primary">Business Media & Branding</h2>
                  <p class="mt-0.5 text-xs text-content-secondary">Customize your brand logo and widescreen cover banner.</p>

                  <div class="mt-4 grid gap-5 md:grid-cols-2">
                    <!-- Logo Card -->
                    <div class="rounded-2xl border border-border-subtle bg-surface-secondary/40 p-4">
                      <p class="text-xs font-semibold text-content-primary">Brand Logo</p>
                      <div class="mt-3 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-brand-50 border border-border-subtle">
                        @if (item.logo_url || logoPreview()) {
                          <img
                            [src]="logoPreview() || item.logo_url"
                            [alt]="item.name + ' logo'"
                            class="h-full w-full object-contain p-2"
                          />
                        } @else {
                          <span class="text-xs text-content-muted">No logo uploaded</span>
                        }
                      </div>

                      <label class="mt-3 block text-xs font-medium text-content-secondary" for="business-logo">
                        Upload new logo (JPEG, PNG, WebP up to 5MB)
                        <input
                          id="business-logo"
                          class="mt-1.5 block w-full text-xs text-content-secondary file:mr-2.5 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          (change)="uploadLogo($event)"
                        />
                      </label>

                      <div class="mt-3 flex items-center gap-2">
                        @if (item.logo_url) {
                          <button
                            type="button"
                            class="ec-btn-danger px-3 py-1.5 text-xs"
                            (click)="deleteLogo()"
                            [disabled]="business.isUploadingLogo()"
                          >
                            Remove logo
                          </button>
                        }
                        @if (business.isUploadingLogo()) {
                          <span role="status" class="text-xs font-medium text-brand-600 animate-pulse">Uploading…</span>
                        }
                      </div>
                    </div>

                    <!-- Cover Card -->
                    <div class="rounded-2xl border border-border-subtle bg-surface-secondary/40 p-4">
                      <p class="text-xs font-semibold text-content-primary">Cover Banner</p>
                      <div class="mt-3 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-brand-50 border border-border-subtle">
                        @if (item.cover_image_url || coverPreview()) {
                          <img
                            [src]="coverPreview() || item.cover_image_url"
                            alt="Cover banner preview"
                            class="h-full w-full object-cover"
                          />
                        } @else {
                          <span class="text-xs text-content-muted">No cover banner uploaded</span>
                        }
                      </div>

                      <label class="mt-3 block text-xs font-medium text-content-secondary" for="business-cover">
                        Upload new banner (JPEG, PNG, WebP up to 8MB)
                        <input
                          id="business-cover"
                          class="mt-1.5 block w-full text-xs text-content-secondary file:mr-2.5 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          (change)="uploadCover($event)"
                        />
                      </label>

                      <div class="mt-3 flex items-center gap-2">
                        @if (item.cover_image_url) {
                          <button
                            type="button"
                            class="ec-btn-danger px-3 py-1.5 text-xs"
                            (click)="deleteCover()"
                            [disabled]="business.isUploadingCover()"
                          >
                            Remove cover
                          </button>
                        }
                        @if (business.isUploadingCover()) {
                          <span role="status" class="text-xs font-medium text-brand-600 animate-pulse">Uploading…</span>
                        }
                      </div>
                    </div>
                  </div>

                  @if (message()) {
                    <p role="status" class="mt-4 rounded-xl border border-brand-primary/20 bg-brand-50 p-3 text-xs font-semibold text-brand-strong">
                      {{ message() }}
                    </p>
                  }
                </div>

                <!-- Danger Zone: Deactivate -->
                @if (canDeactivate(item.current_user_role)) {
                  <div class="mt-10 border-t border-status-danger/20 pt-6">
                    <h2 class="text-base font-bold text-status-danger">Danger Zone</h2>
                    <p class="mt-0.5 text-xs text-content-secondary">Deactivating this business will remove its public page and prevent member access.</p>
                    <button
                      type="button"
                      class="ec-btn-danger mt-4"
                      (click)="confirming.set(true)"
                    >
                      Deactivate Business
                    </button>
                  </div>
                }
              </section>
            } @else {
              <app-empty-state
                icon="info"
                title="Management unavailable"
                description="You do not have administrative permission to edit this business."
                actionLabel="View business page"
                [actionRoute]="'/businesses/' + slug"
              />
            }
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>

    <!-- Confirmation Modal Dialog -->
    @if (confirming()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-content-primary/40 px-4 backdrop-blur-xs" role="presentation">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-title"
          class="w-full max-w-md rounded-3xl border border-border-subtle bg-surface-card p-6 shadow-card"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger/10 text-status-danger">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 id="deactivate-title" class="mt-4 text-xl font-bold text-content-primary">Deactivate this business?</h2>
          <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed">
            Its public business page and posts will no longer be available to the Emirates Connect community. This action cannot be easily undone.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="ec-btn-secondary"
              (click)="confirming.set(false)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="ec-btn-danger"
              (click)="deactivate()"
              [disabled]="business.isSaving()"
            >
              {{ business.isSaving() ? 'Deactivating…' : 'Deactivate' }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
})
export class BusinessEditComponent implements OnDestroy {
  readonly business = inject(BusinessService);
  private readonly auth = inject(AuthService);
  readonly value = signal<Business | null>(null);
  readonly error = signal('');
  readonly message = signal('');
  readonly confirming = signal(false);
  readonly logoPreview = signal<string | null>(null);
  readonly coverPreview = signal<string | null>(null);
  readonly slug: string;
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    if (!this.slug) {
      this.error.set('Business not found.');
      return;
    }
    this.business.getBusiness(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (business) => this.value.set(business),
      error: (error: unknown) => this.error.set(this.business.errorMessage(error)),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  canEdit = canEditBusiness;
  canDeactivate = canDeactivateBusiness;

  saved(business: Business): void {
    this.value.set(business);
    this.message.set('Business saved successfully.');
  }

  uploadLogo(event: Event): void {
    const file = this.validFile(event, 5);
    if (file) {
      this.setPreview(this.logoPreview, file);
      this.business.uploadLogo(this.slug, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (business) => {
          this.value.set(business);
          this.clearPreview(this.logoPreview);
          this.message.set('Logo updated successfully.');
        },
        error: (error: unknown) => this.message.set(this.business.errorMessage(error)),
      });
    }
  }

  uploadCover(event: Event): void {
    const file = this.validFile(event, 8);
    if (file) {
      this.setPreview(this.coverPreview, file);
      this.business.uploadCover(this.slug, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (business) => {
          this.value.set(business);
          this.clearPreview(this.coverPreview);
          this.message.set('Cover banner updated successfully.');
        },
        error: (error: unknown) => this.message.set(this.business.errorMessage(error)),
      });
    }
  }

  deleteLogo(): void {
    this.business.deleteLogo(this.slug).subscribe({
      next: () => {
        this.value.update((business) => business ? { ...business, logo_url: null } : null);
        this.message.set('Logo removed.');
      },
      error: (error: unknown) => this.message.set(this.business.errorMessage(error)),
    });
  }

  deleteCover(): void {
    this.business.deleteCover(this.slug).subscribe({
      next: () => {
        this.value.update((business) => business ? { ...business, cover_image_url: null } : null);
        this.message.set('Cover banner removed.');
      },
      error: (error: unknown) => this.message.set(this.business.errorMessage(error)),
    });
  }

  deactivate(): void {
    this.business.deactivateBusiness(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.confirming.set(false);
        void this.router.navigate(['/businesses']);
      },
      error: (error: unknown) => {
        this.confirming.set(false);
        this.message.set(this.business.errorMessage(error));
      },
    });
  }

  ngOnDestroy(): void {
    this.clearPreview(this.logoPreview);
    this.clearPreview(this.coverPreview);
  }

  private setPreview(target: ReturnType<typeof signal<string | null>>, file: File): void {
    this.clearPreview(target);
    target.set(URL.createObjectURL(file));
  }

  private clearPreview(target: ReturnType<typeof signal<string | null>>): void {
    const preview = target();
    if (preview) URL.revokeObjectURL(preview);
    target.set(null);
  }

  private validFile(event: Event, maxMb: number): File | null {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return null;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxMb * 1024 * 1024) {
      this.message.set(`Use a JPEG, PNG, or WebP image up to ${maxMb} MB.`);
      return null;
    }
    return file;
  }
}
