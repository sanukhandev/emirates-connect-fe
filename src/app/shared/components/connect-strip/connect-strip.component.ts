import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VerificationBadgeComponent } from '../verification-badge/verification-badge.component';
import { Story, StoryService } from '../../../core/stories/story.service';

export interface ConnectUser {
  id: number;
  name: string;
  role: string;
  emirate: string;
  avatar: string;
  isVerified: boolean;
  hasUnreadUpdate?: boolean;
}

@Component({
  selector: 'app-connect-strip',
  imports: [FormsModule, VerificationBadgeComponent],
  template: `
    <section class="rounded-2xl border border-border-subtle bg-surface-card p-3.5 shadow-card" aria-label="Professional Connect Stories">
      <div class="flex items-center justify-between pb-2.5">
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full bg-brand-500"></span>
          <h2 class="text-xs font-bold uppercase tracking-wider text-content-secondary">Connect & Updates</h2>
        </div>
        <span class="text-[11px] font-medium text-brand-600 hover:text-brand-700 cursor-pointer">Explore UAE</span>
      </div>

      <div class="flex items-center gap-3.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
        <!-- Add Update Action -->
        <button
          type="button"
          (click)="creating.set(!creating())"
          class="group flex flex-col items-center gap-1.5 shrink-0 focus-visible:outline-none"
          aria-label="Add your professional update"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-brand-300 bg-brand-50 text-brand-600 transition-all duration-200 group-hover:border-brand-500 group-hover:bg-brand-100 group-hover:scale-105"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span class="text-xs font-medium text-content-primary group-hover:text-brand-600">You</span>
        </button>

        <!-- Live stories -->
        @for (item of stories(); track item.id) {
          <button
            type="button"
            class="group flex flex-col items-center gap-1.5 shrink-0 focus-visible:outline-none"
            [attr.aria-label]="item.user.name + ' story'"
            (click)="selected.set(item)"
          >
            <div
                  class="relative rounded-full border border-brand-400 p-0.5 transition-transform duration-200 group-hover:scale-105"
            >
              <div class="h-13 w-13 overflow-hidden rounded-full border-2 border-white bg-surface-secondary">
                <img
                  [src]="item.user.avatar_url || ''"
                  [alt]="item.user.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              @if (item.user.is_verified) {
                <span class="absolute -bottom-0.5 -right-0.5 scale-90">
                  <app-verification-badge type="professional" />
                </span>
              }
            </div>
            <span class="max-w-[64px] truncate text-xs font-medium text-content-primary group-hover:text-brand-600">
              {{ item.user.name }}
            </span>
          </button>
        }
      </div>
      @if (creating()) {
        <form class="mt-3 space-y-2 border-t border-border-subtle pt-3" (ngSubmit)="create()">
          <label class="sr-only" for="story-body">Story text</label>
          <textarea id="story-body" name="story-body" [(ngModel)]="body" maxlength="500" rows="2" class="w-full rounded-xl border border-border-subtle bg-surface-card p-2 text-xs" placeholder="Share a professional update"></textarea>
          <input type="file" accept="image/jpeg,image/png,image/webp" (change)="selectMedia($event)" class="block w-full text-xs" />
          <div class="flex justify-end gap-2"><button type="button" class="rounded-lg border border-border-subtle px-3 py-1.5 text-xs" (click)="creating.set(false)">Cancel</button><button type="submit" class="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white" [disabled]="saving()">{{ saving() ? 'Posting…' : 'Post story' }}</button></div>
        </form>
      }
      @if (selected(); as story) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-content-primary/70 p-4" role="presentation" (click)="selected.set(null)">
          <section class="relative w-full max-w-md overflow-hidden rounded-3xl bg-surface-card p-5 shadow-card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
            <button type="button" class="absolute right-3 top-3 rounded-full bg-content-primary/70 px-2 py-1 text-xs text-white" (click)="selected.set(null)" aria-label="Close story">✕</button>
            <p class="pr-8 text-sm font-bold">{{ story.user.name }}</p>
            @if (story.media_url) { <img [src]="story.media_url" [alt]="story.user.name + ' story'" class="mt-4 max-h-[60vh] w-full rounded-2xl object-cover" /> }
            @if (story.body) { <p class="mt-4 whitespace-pre-wrap text-sm leading-6 text-content-secondary">{{ story.body }}</p> }
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `],
})
export class ConnectStripComponent {
  readonly addStory = output<void>();
  private readonly storyService = inject(StoryService);
  private readonly destroyRef = inject(DestroyRef);
  readonly stories = this.storyService.stories;
  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly selected = signal<Story | null>(null);
  body = '';
  private media?: File;

  constructor() { this.storyService.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(); }

  selectMedia(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 8 * 1024 * 1024) this.media = file; }
  create(): void { if (!this.body.trim() && !this.media) return; this.saving.set(true); this.storyService.create(this.body, this.media).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.body = ''; this.media = undefined; this.creating.set(false); }, complete: () => this.saving.set(false), error: () => this.saving.set(false) }); }

  readonly connections: ConnectUser[] = [
    {
      id: 101,
      name: 'Aisha',
      role: 'Founding Partner',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: true,
    },
    {
      id: 102,
      name: 'Omar',
      role: 'Fintech Director',
      emirate: 'Abu Dhabi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: true,
    },
    {
      id: 103,
      name: 'Sara',
      role: 'AI Researcher',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: false,
    },
    {
      id: 104,
      name: 'Mohammed',
      role: 'Logistics Lead',
      emirate: 'Sharjah',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
      isVerified: false,
      hasUnreadUpdate: false,
    },
    {
      id: 105,
      name: 'Layla',
      role: 'VC Analyst',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: true,
    },
    {
      id: 106,
      name: 'Zain',
      role: 'Cloud Architect',
      emirate: 'Abu Dhabi',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: false,
    },
    {
      id: 107,
      name: 'Fatima',
      role: 'Growth Strategist',
      emirate: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      hasUnreadUpdate: false,
    },
  ];
}
