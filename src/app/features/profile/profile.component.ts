import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink, TitleCasePipe, PostCardComponent],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <header class="flex items-center justify-between gap-4"><a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a>@if (!editMode) { <a routerLink="/profile/edit" class="rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover">Edit profile</a> }</header>
        @if (profile.isLoading() && !profile.profile()) { <div class="mt-8 h-72 animate-pulse rounded-3xl bg-surface-muted"></div> }
        @if (profile.profile(); as value) {
          <section class="mt-6 overflow-hidden rounded-3xl bg-surface-card shadow-card">
            <div class="relative h-48 bg-brand-soft sm:h-64">@if (value.cover_image_url) { <img [src]="value.cover_image_url" alt="" class="h-full w-full object-cover" /> }<div class="absolute inset-0 bg-gradient-to-t from-content-primary/25 to-transparent"></div><div class="absolute -bottom-12 left-6 flex items-end gap-4 sm:left-10"><div class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-surface-card bg-brand-primary text-2xl font-bold text-white">@if (value.avatar_url) { <img [src]="value.avatar_url" [alt]="(value.display_name || 'Profile') + ' profile photo'" class="h-full w-full object-cover" /> } @else { {{ initials(value.display_name) }} }</div></div></div>
            <div class="px-6 pb-7 pt-16 sm:px-10"><div class="flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-3xl font-bold">{{ value.display_name || auth.currentUser()?.name }}</h1><p class="mt-2 text-lg text-content-secondary">{{ value.headline }}</p><p class="mt-2 text-sm text-content-secondary">{{ value.job_title }} @if (value.company_name) { · {{ value.company_name }} } @if (value.emirate || value.industry) { · {{ value.emirate | titlecase }} @if (value.industry) { · {{ value.industry | titlecase }} } }</p></div>@if (!editMode) { <a routerLink="/my-posts" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium">My posts</a> }</div>
              @if (!editMode) { <div class="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><article class="rounded-2xl border border-border-subtle p-5"><h2 class="text-lg font-semibold">About</h2><p class="mt-3 whitespace-pre-line leading-7 text-content-secondary">{{ value.bio || 'Add a short professional introduction to help people understand your work.' }}</p></article><article class="rounded-2xl border border-border-subtle p-5"><h2 class="text-lg font-semibold">Professional details</h2><dl class="mt-4 space-y-3 text-sm">@if (value.website_url) { <div><dt class="text-content-muted">Website</dt><dd><a [href]="value.website_url" target="_blank" rel="noopener noreferrer" class="break-all text-brand-strong hover:underline">{{ value.website_url }}</a></dd></div> } @if (value.linkedin_url) { <div><dt class="text-content-muted">LinkedIn</dt><dd><a [href]="value.linkedin_url" target="_blank" rel="noopener noreferrer" class="break-all text-brand-strong hover:underline">{{ value.linkedin_url }}</a></dd></div> } @if (!value.website_url && !value.linkedin_url) { <p class="text-content-secondary">No links added yet.</p> }</dl></article></div> }
              @if (editMode) { <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="save()" novalidate>@if (message()) { <div role="status" class="rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand-strong">{{ message() }}</div> }<div class="grid gap-5 sm:grid-cols-2"><label class="block text-sm font-medium">Display name<input formControlName="display_name" class="auth-input" /></label><label class="block text-sm font-medium">Headline<input formControlName="headline" class="auth-input" /></label><label class="block text-sm font-medium">Job title<input formControlName="job_title" class="auth-input" /></label><label class="block text-sm font-medium">Company / Business name<input formControlName="company_name" class="auth-input" /></label><label class="block text-sm font-medium">Industry<select formControlName="industry" class="auth-input"><option value="">Select an industry</option>@for (option of profile.industries(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label><label class="block text-sm font-medium">Emirate<select formControlName="emirate" class="auth-input"><option value="">Select an emirate</option>@for (option of profile.emirates(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label></div><label class="block text-sm font-medium">Bio<textarea formControlName="bio" rows="5" maxlength="2000" class="auth-input resize-y"></textarea></label><div class="grid gap-5 sm:grid-cols-2"><label class="block text-sm font-medium">Website<input formControlName="website_url" type="url" class="auth-input" /></label><label class="block text-sm font-medium">LinkedIn<input formControlName="linkedin_url" type="url" class="auth-input" /></label></div><div class="grid gap-4 sm:grid-cols-2"><label class="rounded-2xl border border-dashed border-border-subtle p-4 text-sm font-medium">Replace avatar<input class="mt-3 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadAvatar($event)" /></label><label class="rounded-2xl border border-dashed border-border-subtle p-4 text-sm font-medium">Replace cover<input class="mt-3 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadCover($event)" /></label></div><div class="flex flex-wrap gap-3"><button type="submit" class="auth-button max-w-xs" [disabled]="profile.isSaving()">{{ profile.isSaving() ? 'Saving…' : 'Save changes' }}</button><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium disabled:opacity-50" (click)="deleteAvatar()" [disabled]="!value.avatar_url || profile.isUploadingAvatar()">Remove avatar</button><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium disabled:opacity-50" (click)="deleteCover()" [disabled]="!value.cover_image_url || profile.isUploadingCover()">Remove cover</button><a routerLink="/profile" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium">Cancel</a></div></form> }@if (!editMode && posts.myPosts().length) { <section class="mt-8 space-y-4"><h2 class="text-xl font-bold">My posts</h2>@for (item of posts.myPosts(); track item.id) { <app-post-card [post]="item" [management]="true" (edit)="openPost(item.id)" /> } </section> }
            </div>
          </section>
        }
      </div>
    </main>
  `,
})
export class ProfileComponent {
  readonly profile = inject(ProfileService);
  readonly posts = inject(PostService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly editMode = this.route.snapshot.data['edit'] === true;
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    display_name: ['', [Validators.required, Validators.maxLength(255)]], headline: ['', [Validators.required, Validators.maxLength(160)]], job_title: ['', [Validators.required, Validators.maxLength(120)]], company_name: ['', Validators.maxLength(255)], industry: [''], emirate: [''], bio: ['', Validators.maxLength(2000)], website_url: [''], linkedin_url: [''],
  });

  constructor() {
    this.profile.getIndustries().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.profile.getEmirates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.profile.getCurrentProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (value) => { this.patchProfile(value); if (!this.editMode) this.posts.getMyPosts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(); } });
  }

  initials(name: string | null): string { return (name || 'EC').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

  save(): void {
    if (this.form.invalid || this.profile.isSaving()) { this.form.markAllAsTouched(); return; }
    this.message.set('');
    this.profile.updateProfile(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.message.set('Profile saved.'), error: (error: unknown) => this.message.set(this.profile.errorMessage(error)) });
  }

  uploadAvatar(event: Event): void { const file = this.file(event, 5); if (file) this.profile.uploadAvatar(file).subscribe({ next: () => this.message.set('Avatar saved.'), error: () => this.message.set('Avatar upload failed.') }); }
  uploadCover(event: Event): void { const file = this.file(event, 8); if (file) this.profile.uploadCoverImage(file).subscribe({ next: () => this.message.set('Cover saved.'), error: () => this.message.set('Cover upload failed.') }); }
  deleteAvatar(): void { this.profile.deleteAvatar().subscribe({ next: () => this.message.set('Avatar removed.') }); }
  deleteCover(): void { this.profile.deleteCoverImage().subscribe({ next: () => this.message.set('Cover removed.') }); }
  openPost(id: number): void { window.location.assign(`/posts/${id}/edit`); }
  private file(event: Event, maxMb: number): File | null { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return null; if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxMb * 1024 * 1024) { this.message.set(`Use a JPEG, PNG, or WebP image up to ${maxMb} MB.`); return null; } return file; }
  private patchProfile(profile: { display_name: string | null; headline: string | null; job_title: string | null; company_name: string | null; industry: string | null; emirate: string | null; bio: string | null; website_url: string | null; linkedin_url: string | null }): void { this.form.patchValue({ ...profile, display_name: profile.display_name ?? '', headline: profile.headline ?? '', job_title: profile.job_title ?? '', company_name: profile.company_name ?? '', industry: profile.industry ?? '', emirate: profile.emirate ?? '', bio: profile.bio ?? '', website_url: profile.website_url ?? '', linkedin_url: profile.linkedin_url ?? '' }); }
}
