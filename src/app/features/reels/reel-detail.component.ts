import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { ReelCardComponent } from './reel-card.component';

@Component({ selector: 'app-reel-detail', imports: [RouterLink, ReelCardComponent], template: `
  <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-3xl"><a routerLink="/reels" class="text-sm font-medium text-brand-strong">← Reels</a>@if (loading()) { <div class="mt-6 h-96 animate-pulse rounded-3xl bg-surface-muted"></div> } @else if (error()) { <section class="mt-6 rounded-3xl bg-surface-card p-10 text-center"><h1 class="text-2xl font-bold">Reel unavailable</h1><p class="mt-2 text-content-secondary">This reel is no longer available.</p></section> } @else if (reel(); as value) { <div class="mt-6"><app-reel-card [reel]="value" /></div> }</div></main>
` })
export class ReelDetailComponent {
  readonly reel = signal<Reel | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ReelService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) { this.loading.set(false); this.error.set(true); return; }
    this.service.getReel(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (reel) => { this.reel.set(reel); this.loading.set(false); }, error: () => { this.loading.set(false); this.error.set(true); } });
  }
}
