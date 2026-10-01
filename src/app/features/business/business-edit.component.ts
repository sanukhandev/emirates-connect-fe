import { Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BusinessService } from '../../core/business/business.service';
import { Business } from '../../core/business/business.models';
import { canDeactivateBusiness, canEditBusiness } from '../../core/business/business.permissions';
import { BusinessFormComponent } from './business-form.component';

@Component({
  selector: 'app-business-edit',
  imports: [BusinessFormComponent, RouterLink],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-5xl"><a [routerLink]="['/businesses', slug]" class="text-sm font-medium text-brand-strong">← Business page</a>@if (business.isLoading()) { <div class="mt-6 h-96 animate-pulse rounded-3xl bg-surface-muted"></div> } @else if (error()) { <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card"><h1 class="text-2xl font-bold">{{ error() }}</h1><a [routerLink]="['/businesses', slug]" class="mt-5 inline-flex rounded-xl border border-border-subtle px-4 py-3 text-sm">Return to business</a></section> } @else if (value(); as item) { @if (canEdit(item.current_user_role)) { <section class="mt-6 rounded-3xl bg-surface-card p-5 shadow-card sm:p-8"><p class="text-sm font-medium text-brand-strong">Business settings</p><h1 class="mt-2 text-3xl font-bold">Edit {{ item.name }}</h1><p class="mt-2 text-content-secondary">The public slug stays stable when the name changes.</p><div class="mt-8"><app-business-form [existing]="item" submitLabel="Save changes" (saved)="saved($event)" /></div><div class="mt-10 border-t border-border-subtle pt-6"><h2 class="text-lg font-semibold">Business media</h2><div class="mt-4 grid gap-5 md:grid-cols-2"><div class="rounded-2xl border border-border-subtle p-4"><div class="h-32 overflow-hidden rounded-xl bg-brand-soft">@if (item.logo_url) { <img [src]="logoPreview() || item.logo_url" [alt]="item.name + ' logo'" class="h-full w-full object-cover" /> }</div><label class="mt-4 block text-sm font-medium" for="business-logo">Replace logo<input id="business-logo" class="mt-2 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadLogo($event)" /></label><div class="mt-3 flex gap-2">@if (item.logo_url) { <button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm" (click)="deleteLogo()" [disabled]="business.isUploadingLogo()">Remove logo</button> } @if (business.isUploadingLogo()) { <span role="status" class="py-2 text-sm text-content-secondary">Uploading…</span> }</div></div><div class="rounded-2xl border border-border-subtle p-4"><div class="h-32 overflow-hidden rounded-xl bg-brand-soft">@if (item.cover_image_url) { <img [src]="coverPreview() || item.cover_image_url" alt="" class="h-full w-full object-cover" /> }</div><label class="mt-4 block text-sm font-medium" for="business-cover">Replace cover image<input id="business-cover" class="mt-2 block w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadCover($event)" /></label><div class="mt-3 flex gap-2">@if (item.cover_image_url) { <button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm" (click)="deleteCover()" [disabled]="business.isUploadingCover()">Remove cover</button> } @if (business.isUploadingCover()) { <span role="status" class="py-2 text-sm text-content-secondary">Uploading…</span> }</div></div></div>@if (message()) { <p role="status" class="mt-4 text-sm text-content-secondary">{{ message() }}</p> }</div>@if (canDeactivate(item.current_user_role)) { <div class="mt-10 border-t border-status-danger/20 pt-6"><h2 class="text-lg font-semibold">Deactivate business</h2><p class="mt-1 text-sm text-content-secondary">The public page will no longer be available.</p><button type="button" class="mt-4 rounded-xl border border-status-danger/40 px-4 py-3 text-sm font-medium text-status-danger" (click)="confirming.set(true)">Deactivate Business</button></div> }</section> } @else { <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card"><h1 class="text-2xl font-bold">Management unavailable</h1><p class="mt-2 text-content-secondary">You do not have permission to edit this business.</p></section> } } @if (confirming()) { <div class="fixed inset-0 z-10 flex items-center justify-center bg-content-primary/40 px-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="deactivate-title" class="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-card"><h2 id="deactivate-title" class="text-xl font-bold">Deactivate this business?</h2><p class="mt-2 text-sm text-content-secondary">Its public business page will no longer be available.</p><div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm" (click)="confirming.set(false)">Cancel</button><button type="button" class="rounded-xl bg-status-danger px-4 py-3 text-sm font-medium text-white disabled:opacity-60" (click)="deactivate()" [disabled]="business.isSaving()">{{ business.isSaving() ? 'Deactivating…' : 'Deactivate' }}</button></div></section></div> }</div></main>
  `,
})
export class BusinessEditComponent implements OnDestroy {
  readonly business = inject(BusinessService);
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
    if (!this.slug) { this.error.set('Business not found.'); return; }
    this.business.getBusiness(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (business) => this.value.set(business), error: (error: unknown) => this.error.set(this.business.errorMessage(error)) });
  }

  canEdit = canEditBusiness;
  canDeactivate = canDeactivateBusiness;

  saved(business: Business): void { this.value.set(business); this.message.set('Business saved.'); }

  uploadLogo(event: Event): void {
    const file = this.validFile(event, 5);
    if (file) {
      this.setPreview(this.logoPreview, file);
      this.business.uploadLogo(this.slug, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (business) => { this.value.set(business); this.clearPreview(this.logoPreview); this.message.set('Logo saved.'); }, error: (error: unknown) => this.message.set(this.business.errorMessage(error)) });
    }
  }

  uploadCover(event: Event): void {
    const file = this.validFile(event, 8);
    if (file) {
      this.setPreview(this.coverPreview, file);
      this.business.uploadCover(this.slug, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (business) => { this.value.set(business); this.clearPreview(this.coverPreview); this.message.set('Cover saved.'); }, error: (error: unknown) => this.message.set(this.business.errorMessage(error)) });
    }
  }

  deleteLogo(): void { this.business.deleteLogo(this.slug).subscribe({ next: () => { this.value.update((business) => business ? { ...business, logo_url: null } : null); this.message.set('Logo removed.'); }, error: (error: unknown) => this.message.set(this.business.errorMessage(error)) }); }
  deleteCover(): void { this.business.deleteCover(this.slug).subscribe({ next: () => { this.value.update((business) => business ? { ...business, cover_image_url: null } : null); this.message.set('Cover removed.'); }, error: (error: unknown) => this.message.set(this.business.errorMessage(error)) }); }

  deactivate(): void {
    this.business.deactivateBusiness(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.confirming.set(false); void this.router.navigate(['/businesses']); }, error: (error: unknown) => { this.confirming.set(false); this.message.set(this.business.errorMessage(error)); } });
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
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxMb * 1024 * 1024) { this.message.set(`Use a JPEG, PNG, or WebP image up to ${maxMb} MB.`); return null; }
    return file;
  }
}
