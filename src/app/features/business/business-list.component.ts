import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { BusinessService } from '../../core/business/business.service';

@Component({
  selector: 'app-business-list',
  imports: [RouterLink, TitleCasePipe],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div><a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a><h1 class="mt-3 text-3xl font-bold">Businesses</h1><p class="mt-2 text-content-secondary">Business pages you operate on Emirates Connect.</p></div>
          <a routerLink="/businesses/create" class="rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-hover">Create Business</a>
        </header>
        @if (business.isLoading()) { <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">@for (item of [1, 2, 3]; track item) { <div class="h-48 animate-pulse rounded-3xl bg-surface-muted"></div> }</div> }
        @else if (error()) { <div role="alert" class="mt-8 rounded-3xl border border-status-danger/25 bg-status-danger/10 p-6 text-status-danger">{{ error() }}</div> }
        @else if (!business.myBusinesses().length) { <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card"><div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-2xl text-brand-strong">◆</div><h2 class="mt-5 text-2xl font-bold">Build your business presence on Emirates Connect.</h2><p class="mx-auto mt-3 max-w-xl text-content-secondary">Create a page when you are ready. Your professional profile does not need to own a business.</p><a routerLink="/businesses/create" class="mt-6 inline-flex rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-hover">Create Business</a></section> }
        @else { <section class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">@for (item of business.myBusinesses(); track item.id) { <a [routerLink]="['/businesses', item.slug]" class="group overflow-hidden rounded-3xl bg-surface-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"><div class="h-24 bg-brand-soft">@if (item.cover_image_url) { <img [src]="item.cover_image_url" alt="" class="h-full w-full object-cover" /> }</div><div class="px-5 pb-5"><div class="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface-card bg-brand-primary text-xl font-bold text-white">@if (item.logo_url) { <img [src]="item.logo_url" [alt]="item.name + ' logo'" class="h-full w-full object-cover" /> } @else { {{ initials(item.name) }} }</div><h2 class="mt-4 text-xl font-bold">{{ item.name }}</h2><p class="mt-1 min-h-6 text-sm text-content-secondary">{{ item.tagline }}</p><p class="mt-4 text-sm text-content-muted">{{ item.emirate | titlecase }} · {{ item.industry | titlecase }}</p><span class="mt-4 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium capitalize text-brand-strong">{{ item.current_user_role }}</span></div></a> }</section>@if (business.myBusinessesMeta(); as meta) { <nav class="mt-6 flex items-center justify-between gap-4 text-sm" aria-label="Business pages"><button type="button" class="rounded-xl border border-border-subtle px-4 py-2 disabled:opacity-50" (click)="load(meta.current_page - 1)" [disabled]="meta.current_page <= 1 || business.isLoading()">Previous</button><span>Page {{ meta.current_page }} of {{ meta.last_page }}</span><button type="button" class="rounded-xl border border-border-subtle px-4 py-2 disabled:opacity-50" (click)="load(meta.current_page + 1)" [disabled]="meta.current_page >= meta.last_page || business.isLoading()">Next</button></nav> } }
      </div>
    </main>
  `,
})
export class BusinessListComponent {
  readonly business = inject(BusinessService);
  readonly error = signal('');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  initials(name: string): string { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

  load(page = 1): void {
    this.error.set('');
    this.business.getMyBusinesses(page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: (error: unknown) => this.error.set(this.business.errorMessage(error)) });
  }
}
