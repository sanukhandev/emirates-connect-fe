import { Component, EventEmitter, inject, input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { BusinessService } from '../../core/business/business.service';
import { Business, BusinessPayload } from '../../core/business/business.models';

@Component({
  selector: 'app-business-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="space-y-5" [formGroup]="form" (ngSubmit)="save()" novalidate>
      @if (message()) { <div role="alert" aria-live="polite" class="rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ message() }}</div> }
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block text-sm font-medium" for="business-name">Business name<input id="business-name" formControlName="name" class="auth-input" autocomplete="organization" />@if (invalid('name')) { <span class="field-error">Business name is required and must be 150 characters or fewer.</span> }</label>
        <label class="block text-sm font-medium" for="business-tagline">Tagline <span class="font-normal text-content-muted">Optional</span><input id="business-tagline" formControlName="tagline" class="auth-input" maxlength="180" />@if (invalid('tagline')) { <span class="field-error">Use 180 characters or fewer.</span> }</label>
        <label class="block text-sm font-medium" for="business-industry">Industry<select id="business-industry" formControlName="industry" class="auth-input"><option value="">Select an industry</option>@for (option of industries(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select>@if (invalid('industry')) { <span class="field-error">Choose an industry.</span> }</label>
        <label class="block text-sm font-medium" for="business-emirate">Emirate<select id="business-emirate" formControlName="emirate" class="auth-input"><option value="">Select an emirate</option>@for (option of emirates(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select>@if (invalid('emirate')) { <span class="field-error">Choose an emirate.</span> }</label>
      </div>
      <label class="block text-sm font-medium" for="business-description">Description <span class="font-normal text-content-muted">Optional</span><textarea id="business-description" formControlName="description" rows="5" maxlength="5000" class="auth-input resize-y"></textarea>@if (invalid('description')) { <span class="field-error">Use 5,000 characters or fewer.</span> }</label>
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="block text-sm font-medium" for="business-website">Website <span class="font-normal text-content-muted">Optional</span><input id="business-website" formControlName="website_url" type="url" class="auth-input" placeholder="https://example.com" />@if (invalid('website_url')) { <span class="field-error">Enter a valid HTTP or HTTPS URL.</span> }</label>
        <label class="block text-sm font-medium" for="business-email">Public business email <span class="font-normal text-content-muted">Optional</span><input id="business-email" formControlName="email" type="email" class="auth-input" autocomplete="email" />@if (invalid('email')) { <span class="field-error">Enter a valid email address.</span> }</label>
        <label class="block text-sm font-medium" for="business-phone">Phone <span class="font-normal text-content-muted">Optional</span><input id="business-phone" formControlName="phone" type="tel" class="auth-input" autocomplete="tel" maxlength="30" />@if (invalid('phone')) { <span class="field-error">Use 30 characters or fewer.</span> }</label>
      </div>
      <button type="submit" class="auth-button max-w-xs" [disabled]="business.isSaving() || loadingOptions()">{{ business.isSaving() ? 'Saving…' : submitLabel() }}</button>
    </form>
  `,
})
export class BusinessFormComponent implements OnChanges {
  readonly business = inject(BusinessService);
  readonly existing = input<Business | null>(null);
  readonly submitLabel = input('Create business');
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
      next: ([industries, emirates]) => { this.industries.set(industries); this.emirates.set(emirates); this.loadingOptions.set(false); },
      error: () => { this.message.set('We could not load the business options.'); this.loadingOptions.set(false); },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existing'] && this.existing()) {
      const business = this.existing();
      if (business) this.form.patchValue({
        name: business.name, tagline: business.tagline ?? '', description: business.description ?? '',
        industry: business.industry, emirate: business.emirate, website_url: business.website_url ?? '',
        email: business.email ?? '', phone: business.phone ?? '',
      });
    }
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[field];
    return control.touched && control.invalid;
  }

  serverError(field: keyof typeof this.form.controls): string | null {
    return this.fieldErrors()[field]?.[0] ?? null;
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
    const request = existing ? this.business.updateBusiness(existing.slug, payload) : this.business.createBusiness(payload);
    request.subscribe({
      next: (business) => this.saved.emit(business),
      error: (error: unknown) => { this.message.set(this.business.errorMessage(error)); this.fieldErrors.set(this.business.validationErrors(error)); },
    });
  }
}
