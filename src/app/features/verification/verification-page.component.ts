import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { BusinessRole } from '../../core/business/business.models';
import { BusinessService } from '../../core/business/business.service';
import { VerificationService } from '../../core/verification/verification.service';
import {
  BusinessVerificationDocumentType,
  VerificationStatus,
  UserVerificationDocumentType,
  VerificationRequestSummary,
  VerificationUpload,
} from '../../core/verification/verification.models';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-verification-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Sticky Header -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[800px] shrink min-w-0 space-y-6 pb-20 md:pb-10">

          <!-- Main Verification Card -->
          <section class="rounded-3xl border border-border-subtle bg-surface-card p-5 sm:p-8 shadow-card">
            <!-- Header with Back Button -->
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-5">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Trust & Authenticity</p>
                <h1 class="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                  {{ isBusiness() ? 'Business Verification' : 'Profile Verification' }}
                </h1>
                <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                  {{ isBusiness()
                    ? 'Confirm this business with commercial registry documents for verified status.'
                    : 'Confirm that your professional identity belongs to a real individual operating in the UAE.'
                  }}
                </p>
              </div>

              <a
                [routerLink]="backLink()"
                class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-secondary px-3.5 py-2 text-xs font-semibold text-content-primary transition hover:border-brand-primary/40 hover:text-brand-primary"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </a>
            </div>

            <!-- Loading State -->
            @if (loading()) {
              <div class="mt-6 h-32 animate-pulse rounded-2xl bg-surface-muted" role="status"></div>
            } @else if (errorMessage()) {
              <!-- Error State -->
              <div role="alert" aria-live="polite" class="mt-6 rounded-2xl border border-status-danger/25 bg-status-danger/10 p-4 text-xs sm:text-sm text-status-danger">
                {{ errorMessage() }}
              </div>
              <button type="button" class="ec-btn-secondary mt-4" (click)="loadStatus()">Retry</button>
            } @else if (status(); as currentStatus) {
              <!-- Status Cards -->
              @if (isBusiness() && !canManageBusiness()) {
                <div role="alert" class="mt-6 rounded-2xl bg-surface-secondary p-4 text-xs sm:text-sm text-content-secondary">
                  You don't have permission to manage verification for this business. Only owners and administrators can submit verification documents.
                </div>
              } @else {
                <!-- State: NOT SUBMITTED -->
                @if (currentStatus === 'not_submitted') {
                  <div class="mt-6 rounded-2xl border border-border-subtle bg-surface-secondary/40 p-5 sm:p-6">
                    <div class="flex items-center gap-3">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <h2 class="text-sm sm:text-base font-bold text-content-primary">
                          {{ isBusiness() ? 'Verify this business' : 'Verify your professional identity' }}
                        </h2>
                        <p class="text-xs text-content-secondary mt-0.5">
                          A verified badge establishes credibility across discovery and search. Reviews are completed confidentially by Emirates Connect.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      class="ec-btn-primary mt-5"
                      (click)="startSubmission()"
                    >
                      Start verification
                    </button>
                  </div>
                }

                <!-- State: PENDING -->
                @if (currentStatus === 'pending') {
                  <div class="mt-6 rounded-2xl border border-brand-primary/20 bg-brand-50/60 p-5 sm:p-6">
                    <div class="flex items-center gap-2.5">
                      <span class="inline-block h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse"></span>
                      <h2 class="text-sm sm:text-base font-bold text-brand-strong">Verification Under Review</h2>
                    </div>
                    <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed">
                      Your documents have been submitted and are in the review queue. Status: <strong>Pending review</strong>
                    </p>
                    @if (request()?.submitted_at) {
                      <p class="mt-1 text-xs text-content-muted">
                        Submitted {{ request()?.submitted_at | date:'mediumDate' }}
                      </p>
                    }
                    <button
                      type="button"
                      class="ec-btn-secondary mt-4 px-4 py-2 text-xs"
                      (click)="loadStatus()"
                      [disabled]="loading()"
                    >
                      {{ loading() ? 'Refreshing…' : 'Refresh status' }}
                    </button>
                  </div>
                }

                <!-- State: APPROVED -->
                @if (currentStatus === 'approved') {
                  <div class="mt-6 rounded-2xl border border-status-success/20 bg-status-success/10 p-5 sm:p-6">
                    <div class="flex items-center gap-2">
                      <svg class="h-5 w-5 text-status-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <h2 class="text-sm sm:text-base font-bold text-status-success">
                        {{ isBusiness() ? 'Business Verified' : 'Profile Verified' }}
                      </h2>
                    </div>
                    <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed">
                      Your verification has been approved. The official verified badge is now displayed publicly on your {{ isBusiness() ? 'business page' : 'profile' }}.
                    </p>
                  </div>
                }

                <!-- State: REJECTED -->
                @if (currentStatus === 'rejected') {
                  <div class="mt-6 rounded-2xl border border-status-danger/25 bg-status-danger/10 p-5 sm:p-6">
                    <h2 class="text-sm sm:text-base font-bold text-status-danger">Verification Needs Attention</h2>
                    @if (request()?.rejection_reason) {
                      <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed whitespace-pre-line">
                        <strong>Reviewer feedback:</strong> {{ request()?.rejection_reason }}
                      </p>
                    }
                    <button
                      type="button"
                      class="ec-btn-primary mt-4"
                      (click)="startSubmission()"
                    >
                      Submit again
                    </button>
                  </div>
                }

                <!-- Submission Form -->
                @if (showForm()) {
                  <form class="mt-8 space-y-5 border-t border-border-subtle pt-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
                    <div>
                      <h2 class="text-base font-bold text-content-primary">
                        {{ isBusiness() ? 'Commercial Registry Details' : 'Legal Identification Details' }}
                      </h2>
                      <p class="mt-0.5 text-xs text-content-secondary">
                        Provide official legal entity credentials matching your documents.
                      </p>
                    </div>

                    @if (isBusiness()) {
                      <label class="block text-xs font-semibold text-content-primary" for="legal-business-name">
                        Legal Business Name
                        <input id="legal-business-name" formControlName="legal_business_name" class="ec-input mt-1.5" autocomplete="organization" />
                        @if (invalid('legal_business_name')) {
                          <span class="mt-1 block text-xs text-status-danger">Legal business name is required.</span>
                        }
                      </label>

                      <div class="grid gap-4 sm:grid-cols-2">
                        <label class="block text-xs font-semibold text-content-primary" for="registration-number">
                          Trade Licence / Registration Number
                          <input id="registration-number" formControlName="registration_number" class="ec-input mt-1.5" />
                          @if (invalid('registration_number')) {
                            <span class="mt-1 block text-xs text-status-danger">Registration number is required.</span>
                          }
                        </label>

                        <label class="block text-xs font-semibold text-content-primary" for="licence-number">
                          Licence Number <span class="font-normal text-content-muted">Optional</span>
                          <input id="licence-number" formControlName="licence_number" class="ec-input mt-1.5" />
                        </label>
                      </div>

                      <label class="block text-xs font-semibold text-content-primary" for="issuing-authority">
                        Issuing Authority <span class="font-normal text-content-muted">e.g. DED, ADGM, DIFC (Optional)</span>
                        <input id="issuing-authority" formControlName="issuing_authority" class="ec-input mt-1.5" />
                      </label>
                    } @else {
                      <label class="block text-xs font-semibold text-content-primary" for="legal-name">
                        Full Legal Name (as shown on Emirates ID / Passport)
                        <input id="legal-name" formControlName="legal_name" class="ec-input mt-1.5" autocomplete="name" />
                        @if (invalid('legal_name')) {
                          <span class="mt-1 block text-xs text-status-danger">Legal name is required.</span>
                        }
                      </label>
                    }

                    <!-- Documents Upload Fieldset -->
                    <fieldset class="border-t border-border-subtle pt-5">
                      <legend class="text-xs font-semibold text-content-primary">Verification Documents</legend>
                      <p class="mt-0.5 text-xs text-content-muted">
                        PDF, JPEG, PNG, or WebP. Up to 10 MB per file, maximum 5 documents.
                      </p>

                      <label
                        class="mt-3 flex flex-col items-center justify-center cursor-pointer rounded-2xl border-2 border-dashed border-border-subtle p-6 transition hover:border-brand-primary bg-surface-secondary/30"
                        for="verification-documents"
                      >
                        <svg class="h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span class="mt-2 text-xs font-semibold text-content-primary">Click to select documents</span>
                        <span class="mt-0.5 text-[11px] text-content-muted">Drag or browse from your device</span>
                        <input
                          id="verification-documents"
                          class="sr-only"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                          (change)="addFiles($event)"
                          [disabled]="files().length >= maxFiles"
                        />
                      </label>

                      @if (fileError()) {
                        <p role="alert" class="mt-2 text-xs font-medium text-status-danger">{{ fileError() }}</p>
                      }

                      @if (files().length) {
                        <ul class="mt-4 space-y-2.5" aria-label="Selected verification documents">
                          @for (upload of files(); track upload.file.name + upload.file.size + $index; let index = $index) {
                            <li class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-card p-3 text-xs shadow-xs">
                              <span class="min-w-0 flex-1 truncate font-medium text-content-primary">
                                {{ upload.file.name }}
                                <span class="font-normal text-content-muted">({{ fileSize(upload.file) }})</span>
                              </span>

                              <select
                                class="rounded-lg border border-border-subtle bg-surface-secondary px-2.5 py-1.5 text-xs font-medium text-content-primary outline-none focus:border-brand-primary"
                                [value]="upload.documentType"
                                [attr.aria-label]="'Document type for ' + upload.file.name"
                                (change)="changeType(index, $event)"
                              >
                                @for (type of documentTypes(); track type.value) {
                                  <option [value]="type.value">{{ type.label }}</option>
                                }
                              </select>

                              <button
                                type="button"
                                class="ec-btn-danger px-2.5 py-1 text-xs"
                                (click)="removeFile(index)"
                                [attr.aria-label]="'Remove ' + upload.file.name"
                              >
                                Remove
                              </button>
                            </li>
                          }
                        </ul>
                      }
                    </fieldset>

                    @if (fieldError('documents')) {
                      <p class="text-xs text-status-danger">{{ fieldError('documents') }}</p>
                    }

                    @if (submitError()) {
                      <p role="alert" aria-live="polite" class="rounded-xl border border-status-danger/25 bg-status-danger/10 p-3.5 text-xs text-status-danger">
                        {{ submitError() }}
                      </p>
                    }

                    <!-- Actions -->
                    <div class="flex flex-wrap gap-3 pt-2">
                      <button
                        type="submit"
                        class="ec-btn-primary px-6"
                        [disabled]="submitting()"
                      >
                        {{ submitting() ? 'Submitting…' : 'Submit for review' }}
                      </button>
                      <button
                        type="button"
                        class="ec-btn-secondary px-5"
                        (click)="cancelSubmission()"
                        [disabled]="submitting()"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                }
              }
            }
          </section>
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class VerificationPageComponent {
  readonly verification = inject(VerificationService);
  readonly business = inject(BusinessService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly isBusiness = signal(this.route.snapshot.data['verificationKind'] === 'business');
  readonly slug = this.route.snapshot.paramMap.get('slug');
  readonly status = signal<VerificationStatus | null>(null);
  readonly request = signal<VerificationRequestSummary | null>(null);
  readonly files = signal<VerificationUpload[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly showForm = signal(false);
  readonly errorMessage = signal('');
  readonly submitError = signal('');
  readonly fileError = signal('');
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly businessRole = signal<BusinessRole | null>(null);
  readonly maxFiles = MAX_FILES;
  readonly userDocumentTypes: Array<{ value: UserVerificationDocumentType; label: string }> = [
    { value: 'identity_document', label: 'Identity document' },
    { value: 'proof_of_professional_identity', label: 'Professional identity' },
    { value: 'other_supporting_document', label: 'Supporting document' },
  ];
  readonly businessDocumentTypes: Array<{ value: BusinessVerificationDocumentType; label: string }> = [
    { value: 'trade_licence', label: 'Trade licence' },
    { value: 'certificate_of_incorporation', label: 'Certificate of incorporation' },
    { value: 'proof_of_business', label: 'Proof of business' },
    { value: 'other_supporting_document', label: 'Supporting document' },
  ];
  readonly form = this.fb.nonNullable.group({
    legal_name: ['', Validators.maxLength(255)],
    legal_business_name: ['', Validators.maxLength(255)],
    registration_number: ['', Validators.maxLength(255)],
    licence_number: ['', Validators.maxLength(255)],
    issuing_authority: ['', Validators.maxLength(255)],
  });

  constructor() {
    this.loadStatus();
  }

  logout(): void {
    this.auth.logout();
  }

  documentTypes(): Array<{ value: string; label: string }> {
    return this.isBusiness() ? this.businessDocumentTypes : this.userDocumentTypes;
  }

  canManageBusiness(): boolean {
    return this.businessRole() === 'owner' || this.businessRole() === 'admin';
  }

  backLink(): string {
    return this.isBusiness() && this.slug ? `/businesses/${encodeURIComponent(this.slug)}` : '/profile';
  }

  loadStatus(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.submitError.set('');
    const request = this.isBusiness() && this.slug ? this.business.getBusiness(this.slug) : null;
    if (request) {
      request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (business) => {
          this.businessRole.set(business.current_user_role);
          this.loadBusinessStatus();
        },
        error: (error: unknown) => this.handleLoadError(error),
      });
      return;
    }
    this.loadUserStatus();
  }

  startSubmission(): void {
    this.showForm.set(true);
    this.submitError.set('');
    this.fieldErrors.set({});
  }

  cancelSubmission(): void {
    this.showForm.set(false);
    this.files.set([]);
    this.fileError.set('');
    this.submitError.set('');
  }

  addFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    input.value = '';
    this.fileError.set('');
    if (this.files().length + picked.length > MAX_FILES) {
      this.fileError.set('You can upload up to 5 documents. Remove a file before adding another.');
      return;
    }
    const type = this.documentTypes()[0].value as UserVerificationDocumentType | BusinessVerificationDocumentType;
    const valid: VerificationUpload[] = [];
    for (const file of picked) {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        this.fileError.set(`${file.name} is not a supported document type.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        this.fileError.set(`${file.name} is larger than 10 MB.`);
        continue;
      }
      valid.push({ file, documentType: type });
    }
    this.files.update((files) => [...files, ...valid]);
  }

  removeFile(index: number): void {
    this.files.update((files) => files.filter((_, fileIndex) => fileIndex !== index));
  }

  changeType(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as UserVerificationDocumentType | BusinessVerificationDocumentType;
    this.files.update((files) => files.map((upload, fileIndex) => fileIndex === index ? { ...upload, documentType: value } : upload));
  }

  fileSize(file: File): string {
    return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }

  invalid(field: 'legal_name' | 'legal_business_name' | 'registration_number'): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  fieldError(field: string): string {
    return this.fieldErrors()[field]?.[0] ?? '';
  }

  submit(): void {
    const required = this.isBusiness() ? ['legal_business_name', 'registration_number'] : ['legal_name'];
    required.forEach((field) => this.form.controls[field as keyof typeof this.form.controls].markAsTouched());
    if (required.some((field) => this.form.controls[field as keyof typeof this.form.controls].invalid) || !this.files().length || this.submitting()) {
      if (!this.files().length) this.fileError.set('Add at least one verification document.');
      return;
    }
    this.submitting.set(true);
    this.submitError.set('');
    this.fieldErrors.set({});
    const values = this.form.getRawValue();
    const request = this.isBusiness() && this.slug
      ? this.verification.submitBusinessVerification(this.slug, {
          legal_business_name: values.legal_business_name,
          registration_number: values.registration_number,
          licence_number: values.licence_number,
          issuing_authority: values.issuing_authority,
          documents: this.files(),
        })
      : this.verification.submitUserVerification({
          legal_name: values.legal_name,
          documents: this.files(),
        });

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.showForm.set(false);
        this.files.set([]);
        this.status.set('pending');
        this.request.set(null);
        this.submitting.set(false);
        this.loadStatus();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.handleSubmitError(error);
      },
    });
  }

  private loadUserStatus(): void {
    this.verification.getUserVerificationStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (value) => this.setStatus(value.status, value.request),
      error: (error: unknown) => this.handleLoadError(error),
    });
  }

  private loadBusinessStatus(): void {
    if (!this.slug) return;
    this.verification.getBusinessVerificationStatus(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (value) => this.setStatus(value.status, value.request),
      error: (error: unknown) => this.handleLoadError(error),
    });
  }

  private setStatus(status: VerificationStatus, request: VerificationRequestSummary | null): void {
    this.status.set(status);
    this.request.set(request);
    this.loading.set(false);
  }

  private handleLoadError(error: unknown): void {
    this.loading.set(false);
    const status = (error as { status?: number }).status;
    this.errorMessage.set(status === 403 ? "You don't have permission to manage verification for this business." : status === 404 ? 'This verification page is unavailable.' : 'Unable to load verification status.');
  }

  private handleSubmitError(error: unknown): void {
    const response = error as { status?: number; error?: { errors?: Record<string, string[]> } };
    this.fieldErrors.set(response.error?.errors ?? {});
    if (response.status === 403) {
      this.submitError.set("You don't have permission to submit verification for this business.");
    } else if (response.status === 409) {
      this.submitError.set('This verification request has already been submitted. Refreshing status…');
      this.loadStatus();
    } else if (response.status === 422) {
      this.submitError.set('Please check the highlighted fields and documents.');
    } else {
      this.submitError.set('Unable to submit verification. Please try again.');
    }
  }
}
