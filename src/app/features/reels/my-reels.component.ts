import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';
import { ReelCardComponent } from './reel-card.component';

@Component({ selector: 'app-my-reels', imports: [FormsModule, RouterLink, ReelCardComponent], template: `
  <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-5xl"><header class="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-5"><div><a routerLink="/reels" class="text-sm font-medium text-brand-strong">← Reels</a><h1 class="mt-3 text-3xl font-bold">My reels</h1><p class="mt-1 text-content-secondary">Manage your personal reels and their processing status.</p></div><a routerLink="/reels/create" class="rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white">Create reel</a></header>@if (error()) { <section class="mt-6 rounded-3xl bg-status-danger/10 p-6 text-status-danger" role="alert">{{ error() }}</section> } @if (loading()) { <div class="mt-6 h-80 animate-pulse rounded-3xl bg-surface-muted"></div> } @else if (!reels().length) { <section class="mt-6 rounded-3xl bg-surface-card p-8 text-center"><p class="text-content-secondary">You have not created a personal reel yet.</p></section> } @else { <section class="mx-auto mt-6 max-w-3xl space-y-5">@for (reel of reels(); track reel.id) { @if (editingId() === reel.id) { <section class="rounded-3xl bg-surface-card p-5 shadow-card"><label [for]="'caption-' + reel.id" class="text-sm font-medium">Caption</label><textarea [id]="'caption-' + reel.id" rows="4" maxlength="2200" class="mt-2 w-full rounded-xl border border-border-subtle bg-surface-card px-4 py-3" [(ngModel)]="editCaption"></textarea><div class="mt-3 flex justify-end gap-2"><button type="button" class="rounded-xl border border-border-subtle px-3 py-2 text-sm" (click)="editingId.set(null)">Cancel</button><button type="button" class="rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-white" (click)="saveCaption(reel)" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button></div></section> } @else { <app-reel-card [reel]="reel" [management]="true" (edit)="startEdit($event)" (remove)="askDelete($event)" /> } }</section> } @if (pendingDelete(); as reel) { <div class="fixed inset-0 z-10 flex items-center justify-center bg-content-primary/40 px-4"><section class="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-card" role="dialog" aria-modal="true" aria-labelledby="delete-reel-title"><h2 id="delete-reel-title" class="text-xl font-bold">Delete this reel?</h2><p class="mt-2 text-sm text-content-secondary">The reel and its media will be removed.</p><div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3" (click)="pendingDelete.set(null)">Cancel</button><button type="button" class="rounded-xl bg-status-danger px-4 py-3 text-white" (click)="deletePending()" [disabled]="saving()">Delete</button></div></section></div> }</div></main>
` })
export class MyReelsComponent {
  readonly reels = signal<Reel[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly pendingDelete = signal<Reel | null>(null);
  readonly editingId = signal<number | null>(null);
  editCaption = '';
  private readonly service = inject(ReelService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() { this.load(); }

  load(): void { this.service.getMyReels().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (response) => { this.reels.set(response.data); this.loading.set(false); }, error: (error: unknown) => { this.error.set(this.service.errorMessage(error)); this.loading.set(false); } }); }
  startEdit(reel: Reel): void { this.editingId.set(reel.id); this.editCaption = reel.caption ?? ''; }
  saveCaption(reel: Reel): void { if (this.saving()) return; this.saving.set(true); this.service.updateReel(reel.id, this.editCaption.trim() || null).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (updated) => { this.reels.update((items) => items.map((item) => item.id === updated.id ? updated : item)); this.editingId.set(null); this.saving.set(false); }, error: (error: unknown) => { this.error.set(this.service.errorMessage(error)); this.saving.set(false); } }); }
  askDelete(reel: Reel): void { this.pendingDelete.set(reel); }
  deletePending(): void { const reel = this.pendingDelete(); if (!reel || this.saving()) return; this.saving.set(true); this.service.deleteReel(reel.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.reels.update((items) => items.filter((item) => item.id !== reel.id)); this.pendingDelete.set(null); this.saving.set(false); }, error: (error: unknown) => { this.error.set(this.service.errorMessage(error)); this.saving.set(false); } }); }
}
