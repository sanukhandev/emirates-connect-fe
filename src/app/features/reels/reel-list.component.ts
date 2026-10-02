import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { ReelCardComponent } from './reel-card.component';

@Component({ selector: 'app-reel-list', imports: [RouterLink, ReelCardComponent], template: `
  <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-5xl"><a [routerLink]="backLink()" class="text-sm font-medium text-brand-strong">← Back</a><h1 class="mt-3 text-3xl font-bold">{{ title() }}</h1>@if (loading()) { <div class="mt-6 h-80 animate-pulse rounded-3xl bg-surface-muted"></div> } @else if (error()) { <section class="mt-6 rounded-3xl bg-surface-card p-8 text-center"><p class="text-content-secondary">Reels are unavailable.</p></section> } @else if (!reels().length) { <section class="mt-6 rounded-3xl bg-surface-card p-8 text-center"><p class="text-content-secondary">No published reels yet.</p></section> } @else { <section class="mt-6 grid gap-5 lg:grid-cols-2">@for (reel of reels(); track reel.id) { <app-reel-card [reel]="reel" /> }</section> }</div></main>
` })
export class ReelListComponent {
  readonly reels = signal<Reel[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly title = signal('Reels');
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReelService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const userId = this.route.snapshot.paramMap.get('id');
    const slug = this.route.snapshot.paramMap.get('slug');
    const request = userId ? this.service.getUserReels(Number(userId)) : this.service.getBusinessReels(slug ?? '');
    this.title.set(userId ? 'Professional reels' : 'Business reels');
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (response) => { this.reels.set(response.data); this.loading.set(false); }, error: () => { this.loading.set(false); this.error.set(true); } });
  }

  backLink(): string { return this.route.snapshot.paramMap.get('id') ? `/users/${this.route.snapshot.paramMap.get('id')}` : `/businesses/${this.route.snapshot.paramMap.get('slug')}`; }
}
