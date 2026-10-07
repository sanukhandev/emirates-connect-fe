import { TitleCasePipe } from '@angular/common';
import { Component, EventEmitter, inject, input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { BusinessService } from '../../core/business/business.service';
import { Business, BusinessPayload } from '../../core/business/business.models';

@Component({
  selector: 'app-business-form',
  imports: [ReactiveFormsModule, RouterLink, TitleCasePipe],
  template: `
    <div [class.lg:grid]="showPreview()" [class.lg:grid-cols-12]="showPreview()" [class.gap-8]="showPreview()">
      <!-- Main Form Section -->
      <div [class.lg:col-span-7]="showPreview()">
        <form class="space-y-6" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <!-- Server Error Message -->
          @if (message()) {
            <div
              role="alert"
              aria-live="polite"
              class="flex items-center gap-2.5 rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
            >
              <svg class="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{{ message() }}</span>
            </div>
          }

          <!-- Group 1: Business Information -->
          <div class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6 space-y-5">
            <div class="border-b border-border-subtle pb-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Business Information
              </h2>
              <p class="text-xs text-content-secondary mt-0.5">Core identity and legal standing for your organization.</p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <!-- Business Name -->
              <div class="space-y-1.5 sm:col-span-2">
                <label for="business-name" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Business name <span class="text-status-danger">*</span>
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <input
                    id="business-name"
                    formControlName="name"
                    autocomplete="organization"
                    placeholder="e.g. Emirates Digital Labs"
                    class="h-11 sm:h-12 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                    [class.border-status-danger]="invalid('name')"
                  />
                </div>
                @if (invalid('name')) {
                  <span class="block text-xs font-medium text-status-danger">Business name is required and must be 150 characters or fewer.</span>
                }
              </div>

              <!-- Tagline -->
              <div class="space-y-1.5 sm:col-span-2">
                <div class="flex items-center justify-between">
                  <label for="business-tagline" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    Tagline
                  </label>
                  <span class="text-xs text-content-muted">Optional</span>
                </div>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <input
                    id="business-tagline"
                    formControlName="tagline"
                    maxlength="180"
                    placeholder="e.g. Building digital products and venture architecture for the UAE"
                    class="h-11 sm:h-12 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                    [class.border-status-danger]="invalid('tagline')"
                  />
                </div>
                @if (invalid('tagline')) {
                  <span class="block text-xs font-medium text-status-danger">Use 180 characters or fewer.</span>
                }
              </div>

              <!-- Industry -->
              <div class="space-y-1.5">
                <label for="business-industry" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Industry <span class="text-status-danger">*</span>
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <select
                    id="business-industry"
                    formControlName="industry"
                    class="h-11 sm:h-12 w-full appearance-none rounded-xl border border-border-subtle bg-white pl-10 pr-10 text-xs sm:text-sm text-content-primary shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 cursor-pointer"
                    [class.border-status-danger]="invalid('industry')"
                  >
                    <option value="">Select an industry</option>
                    @for (option of industries(); track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                @if (invalid('industry')) {
                  <span class="block text-xs font-medium text-status-danger">Choose an industry.</span>
                }
              </div>

              <!-- Emirate -->
              <div class="space-y-1.5">
                <label for="business-emirate" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Emirate <span class="text-status-danger">*</span>
                </label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <select
                    id="business-emirate"
                    formControlName="emirate"
                    class="h-11 sm:h-12 w-full appearance-none rounded-xl border border-border-subtle bg-white pl-10 pr-10 text-xs sm:text-sm text-content-primary shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 cursor-pointer"
                    [class.border-status-danger]="invalid('emirate')"
                  >
                    <option value="">Select an emirate</option>
                    @for (option of emirates(); track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                @if (invalid('emirate')) {
                  <span class="block text-xs font-medium text-status-danger">Choose an emirate.</span>
                }
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-1.5 pt-1">
              <div class="flex items-center justify-between">
                <label for="business-description" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Description
                </label>
                <span class="text-xs text-content-muted">
                  {{ form.controls.description.value.length }} / 5000 (Optional)
                </span>
              </div>
              <textarea
                id="business-description"
                formControlName="description"
                rows="4"
                maxlength="5000"
                placeholder="Tell the Emirates Connect community about your business, operations, services, and what sets you apart in the UAE…"
                class="w-full resize-y rounded-xl border border-border-subtle bg-white p-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                [class.border-status-danger]="invalid('description')"
              ></textarea>
              @if (invalid('description')) {
                <span class="block text-xs font-medium text-status-danger">Use 5,000 characters or fewer.</span>
              }
            </div>
          </div>

          <!-- Group 2: Contact Details -->
          <div class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6 space-y-5">
            <div class="border-b border-border-subtle pb-3">
              <h2 class="text-xs font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Contact Details
              </h2>
              <p class="text-xs text-content-secondary mt-0.5">Communication channels displayed on your public page.</p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <!-- Website -->
              <div class="space-y-1.5 sm:col-span-2">
                <div class="flex items-center justify-between">
                  <label for="business-website" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    Website
                  </label>
                  <span class="text-xs text-content-muted">Optional</span>
                </div>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <input
                    id="business-website"
                    formControlName="website_url"
                    type="url"
                    placeholder="https://example.ae"
                    class="h-11 sm:h-12 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                    [class.border-status-danger]="invalid('website_url')"
                  />
                </div>
                @if (invalid('website_url')) {
                  <span class="block text-xs font-medium text-status-danger">Enter a valid HTTP or HTTPS URL.</span>
                }
              </div>

              <!-- Public Business Email -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="business-email" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    Public business email
                  </label>
                  <span class="text-xs text-content-muted">Optional</span>
                </div>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <input
                    id="business-email"
                    formControlName="email"
                    type="email"
                    autocomplete="email"
                    placeholder="contact@business.ae"
                    class="h-11 sm:h-12 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                    [class.border-status-danger]="invalid('email')"
                  />
                </div>
                @if (invalid('email')) {
                  <span class="block text-xs font-medium text-status-danger">Enter a valid email address.</span>
                }
              </div>

              <!-- Phone -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label for="business-phone" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                    Phone
                  </label>
                  <span class="text-xs text-content-muted">Optional</span>
                </div>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <input
                    id="business-phone"
                    formControlName="phone"
                    type="tel"
                    autocomplete="tel"
                    maxlength="30"
                    placeholder="+971 50 123 4567"
                    class="h-11 sm:h-12 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                    [class.border-status-danger]="invalid('phone')"
                  />
                </div>
                @if (invalid('phone')) {
                  <span class="block text-xs font-medium text-status-danger">Use 30 characters or fewer.</span>
                }
              </div>
            </div>
          </div>

          <!-- Actions Area -->
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="business.isSaving() || loadingOptions()"
            >
              @if (business.isSaving()) {
                <svg class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Saving…</span>
              } @else {
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{{ submitLabel() }}</span>
              }
            </button>

            <a
              routerLink="/businesses"
              class="inline-flex h-12 items-center justify-center rounded-xl border border-border-subtle bg-white px-5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>

      <!-- Right Column: Live Card Preview (Desktop >= 1024px) -->
      @if (showPreview()) {
        <aside class="hidden lg:block lg:col-span-5 space-y-3">
          <div class="sticky top-6">
            <div class="flex items-center justify-between pb-1">
              <span class="text-xs font-semibold uppercase tracking-wider text-content-secondary">Live Card Preview</span>
              <span class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200">
                Public appearance
              </span>
            </div>

            <!-- Preview Business Card -->
            <div class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card">
              <!-- Cover image / gradient preview -->
              <div class="relative h-28 w-full overflow-hidden bg-linear-to-r from-brand-100 via-brand-50 to-brand-200">
                <div class="absolute inset-0 opacity-25">
                  <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none">
                    <defs>
                      <pattern id="preview-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path d="M0 24L24 0M0 0l24 24" stroke="#9470f8" stroke-width="0.5" stroke-opacity="0.25" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#preview-grid)" />
                  </svg>
                </div>
              </div>

              <!-- Card Body -->
              <div class="p-5 pt-0">
                <!-- Logo Avatar with White Border -->
                <div class="-mt-8 relative mb-3 inline-block">
                  <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-3 border-surface-card bg-brand-500 text-lg font-bold text-white shadow-xs">
                    {{ initials(form.controls.name.value || 'EC') }}
                  </div>
                </div>

                <!-- Business Name -->
                <h3 class="text-lg font-bold text-content-primary truncate">
                  {{ form.controls.name.value || 'Your Business Name' }}
                </h3>

                <!-- Tagline -->
                <p class="mt-1 line-clamp-2 text-xs text-content-secondary leading-snug min-h-8">
                  {{ form.controls.tagline.value || 'Your tagline will appear here to summarize your enterprise.' }}
                </p>

                <!-- Location & Industry Meta -->
                <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-content-muted">
                  <span class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                    <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {{ (form.controls.emirate.value || 'Dubai') | titlecase }}
                  </span>
                  <span class="inline-flex items-center rounded-md bg-surface-secondary px-2 py-0.5 font-medium text-content-secondary">
                    {{ (form.controls.industry.value || 'Technology') | titlecase }}
                  </span>
                </div>

                <!-- Role Badge -->
                <div class="mt-3">
                  <span class="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                    Owner
                  </span>
                </div>

                <!-- Preview Actions -->
                <div class="mt-5 flex gap-2 pt-3 border-t border-border-subtle">
                  <div class="flex-1 rounded-xl bg-brand-50 py-1.5 text-center text-xs font-semibold text-brand-700">
                    Manage
                  </div>
                  <div class="flex-1 rounded-xl border border-border-subtle bg-white py-1.5 text-center text-xs font-semibold text-content-primary">
                    View page
                  </div>
                </div>
              </div>
            </div>

            <!-- Helpful Guidance Note -->
            <p class="text-[11px] text-content-muted leading-relaxed px-1 mt-2">
              Media assets (cover banner and high-res logo) can be uploaded directly from business settings once created.
            </p>
          </div>
        </aside>
      }
    </div>
  `,
})
export class BusinessFormComponent implements OnChanges {
  readonly business = inject(BusinessService);
  readonly existing = input<Business | null>(null);
  readonly submitLabel = input('Create business');
  readonly showPreview = input(false);
  readonly industries = signal<{ value: string; label: string }[]>([]);
  readonly emirates = signal<{ value: string; label: string }[]>([]);
  readonly loadingOptions = signal(true);
  readonly message = signal('');
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    tagline: ['', Validators.maxLength(180)],
    description: ['', Validators.maxLength(5000)],
    industry: ['', Validators.required],
    emirate: ['', Validators.required],
    website_url: ['', Validators.pattern(/^https?:\/\/[^\s]+$/i)],
    email: ['', Validators.email],
    phone: ['', Validators.maxLength(30)],
  });

  @Output() readonly saved = new EventEmitter<Business>();

  constructor() {
    forkJoin([this.business.getIndustries(), this.business.getEmirates()]).subscribe({
      next: ([industries, emirates]) => {
        this.industries.set(industries);
        this.emirates.set(emirates);
        this.loadingOptions.set(false);
      },
      error: () => {
        this.message.set('We could not load the business options.');
        this.loadingOptions.set(false);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existing'] && this.existing()) {
      const business = this.existing();
      if (business) {
        this.form.patchValue({
          name: business.name,
          tagline: business.tagline ?? '',
          description: business.description ?? '',
          industry: business.industry,
          emirate: business.emirate,
          website_url: business.website_url ?? '',
          email: business.email ?? '',
          phone: business.phone ?? '',
        });
      }
    }
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  serverError(field: keyof typeof this.form.controls): string | null {
    return this.fieldErrors()[field]?.[0] ?? null;
  }

  initials(name: string): string {
    return (name || 'EC')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  save(): void {
    if (this.form.invalid || this.business.isSaving() || this.loadingOptions()) {
      this.form.markAllAsTouched();
      return;
    }
    this.message.set('');
    this.fieldErrors.set({});
    const value = this.form.getRawValue();
    const payload: BusinessPayload = {
      ...value,
      tagline: value.tagline || null,
      description: value.description || null,
      website_url: value.website_url || null,
      email: value.email || null,
      phone: value.phone || null,
    };
    const existing = this.existing();
    const request = existing
      ? this.business.updateBusiness(existing.slug, payload)
      : this.business.createBusiness(payload);
    request.subscribe({
      next: (business) => this.saved.emit(business),
      error: (error: unknown) => {
        this.message.set(this.business.errorMessage(error));
        this.fieldErrors.set(this.business.validationErrors(error));
      },
    });
  }
}
