import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

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

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-verification-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <a [routerLink]="backLink()" class="text-sm font-medium text-brand-strong">← {{ isBusiness() ? 'Business page' : 'Profile' }}</a>
        <section class="mt-6 rounded-3xl bg-surface-card p-6 shadow-card sm:p-9">
          <p class="text-sm font-medium text-brand-strong">Trust on Emirates Connect</p>
          <h1 class="mt-2 text-3xl font-bold">{{ isBusiness() ? 'Business verification' : 'Profile verification' }}</h1>
          <p class="mt-3 leading-7 text-content-secondary">{{ isBusiness() ? 'Confirm this business with the documents needed for a review.' : 'Confirm that your professional profile belongs to a real professional.' }}</p>

          @if (loading()) { <div role="status" class="mt-8 h-32 animate-pulse rounded-2xl bg-surface-muted"></div> }
          @else if (errorMessage()) { <div role="alert" aria-live="polite" class="mt-8 rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ errorMessage() }}</div><button type="button" class="mt-4 rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium" (click)="loadStatus()">Retry</button> }
          @else if (status(); as currentStatus) {
            @if (isBusiness() && !canManageBusiness()) { <div role="alert" class="mt-8 rounded-2xl border border-border-subtle bg-surface-muted px-4 py-4 text-sm text-content-secondary">You don't have permission to manage verification for this business.</div> }
            @else {
              @if (currentStatus === 'not_submitted') { <div class="mt-8 rounded-2xl border border-border-subtle p-5"><h2 class="text-xl font-semibold">{{ isBusiness() ? 'Verify this business' : 'Verify your professional identity' }}</h2><p class="mt-2 text-sm leading-6 text-content-secondary">Verification helps confirm that this profile belongs to a real professional or active business. Review is completed by the Emirates Connect team.</p><button type="button" class="mt-5 rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-hover" (click)="startSubmission()">Start verification</button></div> }
              @if (currentStatus === 'pending') { <div class="mt-8 rounded-2xl border border-brand-primary/25 bg-brand-soft p-5"><h2 class="text-xl font-semibold">Verification submitted</h2><p class="mt-2 text-sm text-content-secondary">Status: <strong>Pending review</strong></p>@if (request()?.submitted_at) { <p class="mt-1 text-sm text-content-muted">Submitted {{ request()?.submitted_at | date:'mediumDate' }}</p> }<button type="button" class="mt-5 rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-sm font-medium" (click)="loadStatus()" [disabled]="loading()">{{ loading() ? 'Refreshing…' : 'Refresh status' }}</button></div> }
              @if (currentStatus === 'approved') { <div class="mt-8 rounded-2xl border border-status-success/25 bg-status-success/10 p-5"><h2 class="text-xl font-semibold">{{ isBusiness() ? 'Business verified' : 'Profile verified' }}</h2><p class="mt-2 text-sm text-content-secondary">The verified badge is now visible on the public {{ isBusiness() ? 'business page' : 'profile' }}.</p></div> }
              @if (currentStatus === 'rejected') { <div class="mt-8 rounded-2xl border border-status-danger/25 bg-status-danger/10 p-5"><h2 class="text-xl font-semibold">Verification needs attention</h2>@if (request()?.rejection_reason) { <p class="mt-3 whitespace-pre-line text-sm leading-6 text-content-secondary"><strong>Reviewer feedback:</strong> {{ request()?.rejection_reason }}</p> }<button type="button" class="mt-5 rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-hover" (click)="startSubmission()">Submit again</button></div> }

              @if (showForm()) { <form class="mt-8 space-y-5 border-t border-border-subtle pt-8" [formGroup]="form" (ngSubmit)="submit()" novalidate><div><h2 class="text-xl font-semibold">{{ isBusiness() ? 'Verification details' : 'Your legal identity' }}</h2><p class="mt-1 text-sm text-content-secondary">Only the information needed for verification is requested.</p></div>
                @if (isBusiness()) { <label class="block text-sm font-medium" for="legal-business-name">Legal business name<input id="legal-business-name" formControlName="legal_business_name" class="auth-input" autocomplete="organization" />@if (invalid('legal_business_name')) { <span class="field-error">Legal business name is required.</span> }</label><div class="grid gap-5 sm:grid-cols-2"><label class="block text-sm font-medium" for="registration-number">Registration number<input id="registration-number" formControlName="registration_number" class="auth-input" />@if (invalid('registration_number')) { <span class="field-error">Registration number is required.</span> }</label><label class="block text-sm font-medium" for="licence-number">Licence number <span class="font-normal text-content-muted">Optional</span><input id="licence-number" formControlName="licence_number" class="auth-input" /></label></div><label class="block text-sm font-medium" for="issuing-authority">Issuing authority <span class="font-normal text-content-muted">Optional</span><input id="issuing-authority" formControlName="issuing_authority" class="auth-input" /></label> }
                @else { <label class="block text-sm font-medium" for="legal-name">Legal name<input id="legal-name" formControlName="legal_name" class="auth-input" autocomplete="name" />@if (invalid('legal_name')) { <span class="field-error">Legal name is required.</span> }</label> }
                <fieldset><legend class="text-sm font-medium">Documents</legend><p class="mt-1 text-xs text-content-muted">PDF, JPEG, PNG or WebP. Maximum 10 MB each and 5 files.</p><label class="mt-3 block cursor-pointer rounded-2xl border border-dashed border-border-subtle p-4 text-sm font-medium hover:border-brand-primary" for="verification-documents">Add documents<input id="verification-documents" class="sr-only" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" (change)="addFiles($event)" [disabled]="files().length >= maxFiles" /></label>@if (fileError()) { <p role="alert" class="field-error">{{ fileError() }}</p> }@if (files().length) { <ul class="mt-4 space-y-3" aria-label="Selected verification documents">@for (upload of files(); track upload.file.name + upload.file.size + $index; let index = $index) { <li class="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle p-3 text-sm"><span class="min-w-0 flex-1 truncate">{{ upload.file.name }} <span class="text-xs text-content-muted">({{ fileSize(upload.file) }})</span></span><select class="rounded-lg border border-border-subtle bg-surface-card px-2 py-2 text-xs" [value]="upload.documentType" [attr.aria-label]="'Document type for ' + upload.file.name" (change)="changeType(index, $event)">@for (type of documentTypes(); track type.value) { <option [value]="type.value">{{ type.label }}</option> }</select><button type="button" class="rounded-lg border border-border-subtle px-3 py-2 text-xs font-medium hover:border-status-danger" (click)="removeFile(index)" [attr.aria-label]="'Remove ' + upload.file.name">Remove</button></li> }</ul> }</fieldset>
                @if (fieldError('documents')) { <p class="field-error">{{ fieldError('documents') }}</p> }@if (submitError()) { <p role="alert" aria-live="polite" class="rounded-xl border border-status-danger/25 bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{{ submitError() }}</p> }<div class="flex flex-wrap gap-3"><button type="submit" class="rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50" [disabled]="submitting()">{{ submitting() ? 'Submitting…' : 'Submit for review' }}</button><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium" (click)="cancelSubmission()" [disabled]="submitting()">Cancel</button></div>
              </form> }
            }
          }
        </section>
      </div>
    </main>
  `,
})
export class VerificationPageComponent {
  readonly verification = inject(VerificationService);
  readonly business = inject(BusinessService);
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
  readonly userDocumentTypes: Array<{ value: UserVerificationDocumentType; label: string }> = [{ value: 'identity_document', label: 'Identity document' }, { value: 'proof_of_professional_identity', label: 'Professional identity' }, { value: 'other_supporting_document', label: 'Supporting document' }];
  readonly businessDocumentTypes: Array<{ value: BusinessVerificationDocumentType; label: string }> = [{ value: 'trade_licence', label: 'Trade licence' }, { value: 'certificate_of_incorporation', label: 'Certificate of incorporation' }, { value: 'proof_of_business', label: 'Proof of business' }, { value: 'other_supporting_document', label: 'Supporting document' }];
  readonly form = this.fb.nonNullable.group({ legal_name: ['', Validators.maxLength(255)], legal_business_name: ['', Validators.maxLength(255)], registration_number: ['', Validators.maxLength(255)], licence_number: ['', Validators.maxLength(255)], issuing_authority: ['', Validators.maxLength(255)] });

  constructor() { this.loadStatus(); }

  documentTypes(): Array<{ value: string; label: string }> { return this.isBusiness() ? this.businessDocumentTypes : this.userDocumentTypes; }
  canManageBusiness(): boolean { return this.businessRole() === 'owner' || this.businessRole() === 'admin'; }
  backLink(): string { return this.isBusiness() && this.slug ? `/businesses/${encodeURIComponent(this.slug)}` : '/profile'; }

  loadStatus(): void {
    this.loading.set(true); this.errorMessage.set(''); this.submitError.set('');
    const request = this.isBusiness() && this.slug ? this.business.getBusiness(this.slug) : null;
    if (request) {
      request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (business) => { this.businessRole.set(business.current_user_role); this.loadBusinessStatus(); }, error: (error: unknown) => this.handleLoadError(error) });
      return;
    }
    this.loadUserStatus();
  }

  startSubmission(): void { this.showForm.set(true); this.submitError.set(''); this.fieldErrors.set({}); }
  cancelSubmission(): void { this.showForm.set(false); this.files.set([]); this.fileError.set(''); this.submitError.set(''); }

  addFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []); input.value = ''; this.fileError.set('');
    if (this.files().length + picked.length > MAX_FILES) { this.fileError.set('You can upload up to 5 documents. Remove a file before adding another.'); return; }
    const type = this.documentTypes()[0].value as UserVerificationDocumentType | BusinessVerificationDocumentType;
    const valid: VerificationUpload[] = [];
    for (const file of picked) { if (!ACCEPTED_MIME_TYPES.includes(file.type)) { this.fileError.set(`${file.name} is not a supported document type.`); continue; } if (file.size > MAX_FILE_SIZE) { this.fileError.set(`${file.name} is larger than 10 MB.`); continue; } valid.push({ file, documentType: type }); }
    this.files.update((files) => [...files, ...valid]);
  }

  removeFile(index: number): void { this.files.update((files) => files.filter((_, fileIndex) => fileIndex !== index)); }
  changeType(index: number, event: Event): void { const value = (event.target as HTMLSelectElement).value as UserVerificationDocumentType | BusinessVerificationDocumentType; this.files.update((files) => files.map((upload, fileIndex) => fileIndex === index ? { ...upload, documentType: value } : upload)); }
  fileSize(file: File): string { return `${(file.size / 1024 / 1024).toFixed(2)} MB`; }
  invalid(field: 'legal_name' | 'legal_business_name' | 'registration_number'): boolean { const control = this.form.controls[field]; return control.touched && control.invalid; }
  fieldError(field: string): string { return this.fieldErrors()[field]?.[0] ?? ''; }

  submit(): void {
    const required = this.isBusiness() ? ['legal_business_name', 'registration_number'] : ['legal_name'];
    required.forEach((field) => this.form.controls[field as keyof typeof this.form.controls].markAsTouched());
    if (required.some((field) => this.form.controls[field as keyof typeof this.form.controls].invalid) || !this.files().length || this.submitting()) { if (!this.files().length) this.fileError.set('Add at least one verification document.'); return; }
    this.submitting.set(true); this.submitError.set(''); this.fieldErrors.set({});
    const values = this.form.getRawValue();
    const request = this.isBusiness() && this.slug ? this.verification.submitBusinessVerification(this.slug, { legal_business_name: values.legal_business_name, registration_number: values.registration_number, licence_number: values.licence_number, issuing_authority: values.issuing_authority, documents: this.files() }) : this.verification.submitUserVerification({ legal_name: values.legal_name, documents: this.files() });
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.showForm.set(false); this.files.set([]); this.status.set('pending'); this.request.set(null); this.submitting.set(false); this.loadStatus(); }, error: (error: unknown) => { this.submitting.set(false); this.handleSubmitError(error); } });
  }

  private loadUserStatus(): void { this.verification.getUserVerificationStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (value) => this.setStatus(value.status, value.request), error: (error: unknown) => this.handleLoadError(error) }); }
  private loadBusinessStatus(): void { if (!this.slug) return; this.verification.getBusinessVerificationStatus(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (value) => this.setStatus(value.status, value.request), error: (error: unknown) => this.handleLoadError(error) }); }
  private setStatus(status: VerificationStatus, request: VerificationRequestSummary | null): void { this.status.set(status); this.request.set(request); this.loading.set(false); }
  private handleLoadError(error: unknown): void { this.loading.set(false); const status = (error as { status?: number }).status; this.errorMessage.set(status === 403 ? "You don't have permission to manage verification for this business." : status === 404 ? 'This verification page is unavailable.' : 'Unable to load verification status.'); }
  private handleSubmitError(error: unknown): void { const response = error as { status?: number; error?: { errors?: Record<string, string[]> } }; this.fieldErrors.set(response.error?.errors ?? {}); if (response.status === 403) this.submitError.set("You don't have permission to submit verification for this business."); else if (response.status === 409) { this.submitError.set('This verification request has already been submitted. Refreshing status…'); this.loadStatus(); } else if (response.status === 422) this.submitError.set('Please check the highlighted fields and documents.'); else this.submitError.set('Unable to submit verification. Please try again.'); }
}
