import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';

@Component({
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section class="rounded-3xl bg-brand-strong p-6 text-white shadow-card sm:p-8">
          <p class="text-sm font-medium uppercase tracking-[0.18em] text-brand-100">Emirates Connect</p>
          <h1 class="mt-12 text-4xl font-bold tracking-tight">Build your professional presence.</h1>
          <p class="mt-4 leading-7 text-white/80">A clear profile helps the UAE business community understand what you do.</p>
          <div class="mt-12 flex gap-2" aria-label="Onboarding progress">
            @for (step of [0, 1, 2]; track step) { <span class="h-2 flex-1 rounded-full" [class]="currentStep() >= step ? 'bg-white' : 'bg-white/30'"></span> }
          </div>
          <p class="mt-3 text-sm text-white/75">Step {{ currentStep() + 1 }} of 3</p>
        </section>

        <section class="rounded-3xl bg-surface-card p-5 shadow-card sm:p-8">
          <div class="mb-7 flex items-start justify-between gap-4">
            <div><p class="text-sm font-medium text-brand-strong">Your profile</p><h2 class="mt-1 text-2xl font-bold">{{ stepTitle() }}</h2></div>
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-lg font-bold text-brand-strong">{{ initials() }}</div>
          </div>
          @if (errorMessage()) { <div role="alert" aria-live="polite" class="mb-5 rounded-2xl border border-status-danger/25 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{{ errorMessage() }}</div> }
          <form [formGroup]="form" (ngSubmit)="next()" novalidate>
            @if (currentStep() === 0) {
              <div class="space-y-5">
                <label class="block text-sm font-medium" for="onboarding-display-name">Display name<input id="onboarding-display-name" formControlName="display_name" class="auth-input" autocomplete="name" /></label>
                @if (invalid('display_name')) { <p class="field-error">Display name is required.</p> }
                <label class="block text-sm font-medium" for="onboarding-headline">Headline<input id="onboarding-headline" formControlName="headline" class="auth-input" placeholder="Founder & CEO at Example Technologies" /></label>
                @if (invalid('headline')) { <p class="field-error">Headline is required and must be 160 characters or fewer.</p> }
                <label class="block text-sm font-medium" for="onboarding-job-title">Job title<input id="onboarding-job-title" formControlName="job_title" class="auth-input" placeholder="Founder, Managing Director, Tech Lead" /></label>
                @if (invalid('job_title')) { <p class="field-error">Job title is required.</p> }
              </div>
            }
            @if (currentStep() === 1) {
              <div class="space-y-5">
                <label class="block text-sm font-medium" for="onboarding-industry">Industry<select id="onboarding-industry" formControlName="industry" class="auth-input"><option value="">Select an industry</option>@for (option of profile.industries(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label>
                @if (invalid('industry')) { <p class="field-error">Choose an industry.</p> }
                <label class="block text-sm font-medium" for="onboarding-emirate">Emirate<select id="onboarding-emirate" formControlName="emirate" class="auth-input"><option value="">Select an emirate</option>@for (option of profile.emirates(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label>
                @if (invalid('emirate')) { <p class="field-error">Choose an emirate.</p> }
                <label class="block text-sm font-medium" for="onboarding-company">Company / Business name <span class="font-normal text-content-muted">Optional</span><input id="onboarding-company" formControlName="company_name" class="auth-input" /><span class="mt-1 block text-xs text-content-muted">This does not create a business page.</span></label>
              </div>
            }
            @if (currentStep() === 2) {
              <div class="space-y-5">
                <label class="block text-sm font-medium" for="onboarding-bio">Bio <span class="font-normal text-content-muted">Optional</span><textarea id="onboarding-bio" formControlName="bio" rows="4" maxlength="2000" class="auth-input resize-y"></textarea></label>
                <div class="grid gap-5 sm:grid-cols-2"><label class="block text-sm font-medium" for="onboarding-website">Website <span class="font-normal text-content-muted">Optional</span><input id="onboarding-website" formControlName="website_url" type="url" class="auth-input" placeholder="https://example.com" /></label><label class="block text-sm font-medium" for="onboarding-linkedin">LinkedIn profile <span class="font-normal text-content-muted">Optional</span><input id="onboarding-linkedin" formControlName="linkedin_url" type="url" class="auth-input" placeholder="https://www.linkedin.com/in/you" /></label></div>
                <div class="grid gap-4 sm:grid-cols-2"><label class="rounded-2xl border border-dashed border-border-subtle p-4 text-sm font-medium">Avatar<input class="mt-3 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadAvatar($event)" /></label><label class="rounded-2xl border border-dashed border-border-subtle p-4 text-sm font-medium">Cover image<input class="mt-3 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadCover($event)" /></label></div>
                @if (mediaMessage()) { <p role="status" class="text-sm text-content-secondary">{{ mediaMessage() }}</p> }
              </div>
            }
            <div class="mt-8 flex items-center justify-between gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium hover:border-brand-primary disabled:opacity-50" (click)="back()" [disabled]="currentStep() === 0 || saving()">Back</button><button type="submit" class="auth-button max-w-xs" [disabled]="saving()">{{ saving() ? 'Saving…' : currentStep() === 2 ? 'Complete profile' : 'Continue' }}</button></div>
          </form>
        </section>
      </div>
    </main>
  `,
})
export class OnboardingComponent {
  readonly profile = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly currentStep = signal(0);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly mediaMessage = signal('');
  readonly form = this.fb.nonNullable.group({
    display_name: ['', [Validators.required, Validators.maxLength(255)]], headline: ['', [Validators.required, Validators.maxLength(160)]], job_title: ['', [Validators.required, Validators.maxLength(120)]],
    industry: ['', Validators.required], emirate: ['', Validators.required], company_name: ['', Validators.maxLength(255)], bio: ['', Validators.maxLength(2000)], website_url: [''], linkedin_url: [''],
  });

  constructor() {
    const userProfile = this.auth.currentUser()?.profile;
    if (userProfile) this.patchProfile(userProfile);
    forkJoin([this.profile.getIndustries(), this.profile.getEmirates(), this.profile.getCurrentProfile()]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([, , profile]) => this.patchProfile(profile), error: () => this.errorMessage.set('We could not load the profile options.')
    });
  }

  stepTitle(): string { return ['Professional identity', 'Business context', 'Profile presence'][this.currentStep()]; }
  initials(): string { return (this.form.controls.display_name.value || this.auth.currentUser()?.name || 'EC').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
  invalid(field: keyof typeof this.form.controls): boolean { const control = this.form.controls[field]; return control.touched && control.invalid; }

  next(): void {
    const required = this.currentStep() === 0 ? ['display_name', 'headline', 'job_title'] : this.currentStep() === 1 ? ['industry', 'emirate'] : [];
    required.forEach((field) => this.form.controls[field as keyof typeof this.form.controls].markAsTouched());
    if (required.some((field) => this.form.controls[field as keyof typeof this.form.controls].invalid) || this.saving()) return;
    const payload = this.form.getRawValue();
    this.saving.set(true); this.errorMessage.set('');
    this.profile.updateProfile(payload).pipe(
      switchMap(() => this.currentStep() === 2 ? this.profile.completeOnboarding(payload) : [payload]),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: () => { if (this.currentStep() === 2) this.router.navigateByUrl('/profile'); else this.currentStep.update((step) => step + 1); }, error: (error: unknown) => { this.errorMessage.set(this.profile.errorMessage(error)); this.saving.set(false); }, complete: () => this.saving.set(false) });
  }

  back(): void { if (this.currentStep() > 0) this.currentStep.update((step) => step - 1); }

  uploadAvatar(event: Event): void { const file = this.file(event, 5); if (file) this.profile.uploadAvatar(file).subscribe({ next: () => this.mediaMessage.set('Avatar saved.'), error: () => this.mediaMessage.set('Avatar upload failed.') }); }
  uploadCover(event: Event): void { const file = this.file(event, 8); if (file) this.profile.uploadCoverImage(file).subscribe({ next: () => this.mediaMessage.set('Cover image saved.'), error: () => this.mediaMessage.set('Cover image upload failed.') }); }

  private file(event: Event, maxMb: number): File | null { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return null; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxMb * 1024 * 1024) { this.mediaMessage.set(`Use a JPEG, PNG, or WebP image up to ${maxMb} MB.`); return null; } return file; }
  private patchProfile(profile: { display_name: string | null; headline: string | null; job_title: string | null; industry: string | null; emirate: string | null; company_name: string | null; bio: string | null; website_url: string | null; linkedin_url: string | null }): void { this.form.patchValue({ ...profile, display_name: profile.display_name ?? '', headline: profile.headline ?? '', job_title: profile.job_title ?? '', industry: profile.industry ?? '', emirate: profile.emirate ?? '', company_name: profile.company_name ?? '', bio: profile.bio ?? '', website_url: profile.website_url ?? '', linkedin_url: profile.linkedin_url ?? '' }); }
}
