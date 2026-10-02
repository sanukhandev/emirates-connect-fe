import { Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { Business } from '../../core/business/business.models';
import { BusinessService } from '../../core/business/business.service';
import { Reel } from '../../core/reel/reel.models';
import { ReelService } from '../../core/reel/reel.service';

@Component({ selector: 'app-reel-create', imports: [FormsModule, RouterLink], template: `
  <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-3xl"><a routerLink="/reels" class="text-sm font-medium text-brand-strong">← Reels</a><section class="mt-4 rounded-3xl bg-surface-card p-5 shadow-card sm:p-8"><h1 class="text-3xl font-bold">Create a reel</h1><p class="mt-2 text-content-secondary">Share one short MP4 video with your professional network.</p>@if (error()) { <div class="mt-5 rounded-2xl border border-status-danger/25 bg-status-danger/10 p-4 text-sm text-status-danger" role="alert">{{ error() }}</div> }<form class="mt-6 space-y-5" (ngSubmit)="submit()"><div><label for="author" class="mb-2 block text-sm font-medium">Publish as</label><select id="author" name="author" class="w-full rounded-xl border border-border-subtle bg-surface-card px-4 py-3" [(ngModel)]="authorChoice" [disabled]="busy()"><option value="user">My profile</option>@for (business of businesses(); track business.id) { <option [value]="'business:' + business.id">{{ business.name }} ({{ business.current_user_role }})</option> }</select></div><div><label for="caption" class="mb-2 block text-sm font-medium">Caption <span class="text-content-muted">(optional)</span></label><textarea id="caption" name="caption" rows="4" maxlength="2200" class="w-full rounded-xl border border-border-subtle bg-surface-card px-4 py-3" placeholder="What should your network know?" [(ngModel)]="caption" [disabled]="busy()"></textarea><p class="mt-1 text-right text-xs text-content-muted">{{ caption.length }}/2200</p></div><div><label for="video" class="mb-2 block text-sm font-medium">Video</label><input id="video" name="video" type="file" accept="video/mp4" class="block w-full rounded-xl border border-border-subtle bg-surface-card p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-medium file:text-brand-strong" (change)="selectFile($event)" [disabled]="busy()" /><p class="mt-2 text-xs text-content-muted">MP4 only, maximum 100 MB. Exactly one video.</p>@if (file(); as selected) { <div class="mt-3 rounded-2xl bg-surface-muted p-3 text-sm"><p class="truncate font-medium">{{ selected.name }}</p><p class="mt-1 text-content-secondary">{{ sizeLabel(selected.size) }} · {{ selected.type }}</p><video class="mt-3 max-h-72 w-full rounded-xl bg-content-primary object-contain" controls muted playsinline [src]="previewUrl() || undefined" aria-label="Selected video preview"></video></div> }</div>@if (createdReel(); as created) { <div class="rounded-2xl border border-status-success/25 bg-status-success/10 p-4 text-sm"><p class="font-semibold">Reel created.</p><p class="mt-1">{{ created.status === 'published' ? 'It is published.' : 'It is processing.' }} You can retry the upload if needed.</p></div> }<div class="flex flex-wrap justify-end gap-3"><a routerLink="/reels" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium">Cancel</a><button type="submit" class="rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50" [disabled]="busy() || !file()">{{ busy() ? 'Uploading…' : createdReel() ? 'Retry upload' : 'Publish reel' }}</button></div></form></section></div></main>
` })
export class ReelCreateComponent implements OnDestroy {
  readonly businesses = signal<Business[]>([]);
  readonly file = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly createdReel = signal<Reel | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  authorChoice = 'user';
  caption = '';
  private readonly businessService = inject(BusinessService);
  private readonly service = inject(ReelService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.businessService.getMyBusinesses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (response) => this.businesses.set(response.data) });
  }

  ngOnDestroy(): void { this.revokePreview(); }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    this.error.set('');
    this.revokePreview();
    if (!selected) { this.file.set(null); return; }
    if (selected.type !== 'video/mp4') { this.file.set(null); this.error.set('Please choose an MP4 video.'); input.value = ''; return; }
    if (selected.size > 100 * 1024 * 1024) { this.file.set(null); this.error.set('The video must be 100 MB or smaller.'); input.value = ''; return; }
    this.file.set(selected); this.previewUrl.set(URL.createObjectURL(selected));
  }

  submit(): void {
    const selected = this.file();
    if (!selected || this.busy()) return;
    this.error.set(''); this.busy.set(true);
    const existing = this.createdReel();
    const create$ = existing ? this.service.uploadVideo(existing.id, selected) : this.service.createReel({ author_type: this.authorChoice === 'user' ? 'user' : 'business', ...(this.authorChoice === 'user' ? {} : { business_id: Number(this.authorChoice.split(':')[1]) }), caption: this.caption.trim() || null }).pipe(switchMap((reel) => { this.createdReel.set(reel); return this.service.uploadVideo(reel.id, selected); }));
    create$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (reel) => { this.busy.set(false); this.createdReel.set(reel); if (reel.status === 'published') void this.router.navigate(['/reels', reel.id]); }, error: (error: unknown) => { this.busy.set(false); this.error.set(this.service.errorMessage(error)); } });
  }

  sizeLabel(bytes: number): string { return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
  private revokePreview(): void { const url = this.previewUrl(); if (url) URL.revokeObjectURL(url); this.previewUrl.set(null); }
}
