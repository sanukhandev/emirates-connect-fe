import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BusinessService } from '../../core/business/business.service';
import { canEditBusiness } from '../../core/business/business.permissions';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';

@Component({
  selector: 'app-business-page',
  imports: [RouterLink, TitleCasePipe, PostCardComponent],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-6xl"><a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a>@if (business.isLoading()) { <div class="mt-6 h-96 animate-pulse rounded-3xl bg-surface-muted"></div> } @else if (error()) { <section class="mt-8 rounded-3xl bg-surface-card p-10 text-center shadow-card"><h1 class="text-2xl font-bold">Business not found</h1><p class="mt-2 text-content-secondary">This business page is unavailable.</p><a routerLink="/businesses" class="mt-6 inline-flex rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium">Browse your businesses</a></section> } @else if (business.currentBusiness(); as value) { <section class="mt-6 overflow-hidden rounded-3xl bg-surface-card shadow-card"><div class="relative h-52 bg-brand-soft sm:h-72">@if (value.cover_image_url) { <img [src]="value.cover_image_url" alt="" class="h-full w-full object-cover" /> }<div class="absolute inset-0 bg-gradient-to-t from-content-primary/30 to-transparent"></div></div><div class="relative px-6 pb-8 sm:px-10"><div class="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-surface-card bg-brand-primary text-2xl font-bold text-white">@if (value.logo_url) { <img [src]="value.logo_url" [alt]="value.name + ' logo'" class="h-full w-full object-cover" /> } @else { {{ initials(value.name) }} }</div><div class="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-3xl font-bold">{{ value.name }}</h1><p class="mt-2 text-lg text-content-secondary">{{ value.tagline }}</p><p class="mt-2 text-sm text-content-muted">{{ value.emirate | titlecase }} · {{ value.industry | titlecase }}</p></div>@if (canEdit(value.current_user_role)) { <div class="flex flex-wrap gap-2"><a [routerLink]="['/businesses', value.slug, 'edit']" class="rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-hover">Edit Business</a><a [routerLink]="['/businesses', value.slug, 'members']" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium hover:border-brand-primary">Manage Members</a></div> }</div><div class="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><article class="rounded-2xl border border-border-subtle p-5"><h2 class="text-lg font-semibold">About</h2><p class="mt-3 whitespace-pre-line leading-7 text-content-secondary">{{ value.description || 'No business description added yet.' }}</p></article><article class="rounded-2xl border border-border-subtle p-5"><h2 class="text-lg font-semibold">Contact</h2><dl class="mt-4 space-y-3 text-sm">@if (safeUrl(value.website_url); as website) { <div><dt class="text-content-muted">Website</dt><dd><a [href]="website" target="_blank" rel="noopener noreferrer" class="break-all text-brand-strong hover:underline">{{ website }}</a></dd></div> } @if (value.email) { <div><dt class="text-content-muted">Email</dt><dd><a [href]="'mailto:' + value.email" class="break-all text-brand-strong hover:underline">{{ value.email }}</a></dd></div> } @if (value.phone) { <div><dt class="text-content-muted">Phone</dt><dd><a [href]="'tel:' + value.phone" class="text-brand-strong hover:underline">{{ value.phone }}</a></dd></div> } @if (!value.website_url && !value.email && !value.phone) { <p class="text-content-secondary">No contact details added.</p> }</dl></article></div>@if (posts.businessPosts().length) { <section class="mt-6 space-y-4"><h2 class="text-xl font-bold">Latest updates</h2>@for (item of posts.businessPosts(); track item.id) { <app-post-card [post]="item" /> }</section>}</div></section> }</div></main>
  `,
})
export class BusinessPageComponent {
  readonly business = inject(BusinessService);
  readonly posts = inject(PostService);
  readonly error = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) { this.error.set(true); return; }
    this.business.getBusiness(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.posts.getBusinessPosts(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(), error: () => this.error.set(true) });
  }

  canEdit = canEditBusiness;
  initials(name: string): string { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
  safeUrl(value: string | null): string | null { if (!value) return null; try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null; } catch { return null; } }
}
