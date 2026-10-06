import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VerificationBadgeComponent } from '../../shared/components/verification-badge/verification-badge.component';

interface SuggestedUser {
  id: number;
  name: string;
  role: string;
  location: string;
  avatar: string;
  isVerified: boolean;
  connected: boolean;
}

interface TrendingTag {
  tag: string;
  category: string;
  postsCount: string;
}

interface FollowBusiness {
  id: number;
  name: string;
  industry: string;
  location: string;
  logo: string;
  isVerified: boolean;
  following: boolean;
}

@Component({
  selector: 'app-right-sidebar',
  imports: [RouterLink, VerificationBadgeComponent],
  template: `
    <aside class="sticky top-6 flex w-72 flex-col gap-4.5 xl:w-80" aria-label="Contextual Discovery">
      <!-- CARD 1: Suggested Connections -->
      <section class="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-card">
        <div class="flex items-center justify-between pb-3 border-b border-border-subtle">
          <h2 class="text-sm font-bold text-content-primary">Suggested Connections</h2>
          <a routerLink="/search" class="text-xs font-medium text-brand-600 hover:text-brand-700">View all</a>
        </div>

        <div class="mt-3 space-y-3.5">
          @for (user of suggestedUsers(); track user.id) {
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-secondary border border-border-subtle">
                  <img [src]="user.avatar" [alt]="user.name" class="h-full w-full object-cover" loading="lazy" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1">
                    <p class="truncate text-xs font-semibold text-content-primary">{{ user.name }}</p>
                    @if (user.isVerified) {
                      <app-verification-badge type="professional" />
                    }
                  </div>
                  <p class="truncate text-[11px] text-content-secondary">{{ user.role }} · {{ user.location }}</p>
                </div>
              </div>

              <button
                type="button"
                (click)="toggleConnect(user.id)"
                class="shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none"
                [class.bg-brand-50]="user.connected"
                [class.text-brand-700]="user.connected"
                [class.bg-brand-500]="!user.connected"
                [class.text-white]="!user.connected"
                [class.hover:bg-brand-600]="!user.connected"
              >
                {{ user.connected ? 'Pending' : 'Connect' }}
              </button>
            </div>
          }
        </div>
      </section>

      <!-- CARD 2: Trending in UAE -->
      <section class="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-card">
        <div class="flex items-center justify-between pb-2.5">
          <div class="flex items-center gap-2">
            <span class="inline-block h-2 w-2 rounded-full bg-status-success"></span>
            <h2 class="text-sm font-bold text-content-primary">Trending in UAE</h2>
          </div>
          <span class="text-[11px] font-medium text-content-muted">Today</span>
        </div>

        <div class="mt-2.5 space-y-3">
          @for (item of trendingTags; track item.tag) {
            <a
              routerLink="/search"
              [queryParams]="{ q: item.tag }"
              class="group block transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-content-primary group-hover:text-brand-600">
                  {{ item.tag }}
                </span>
                <span class="text-[11px] text-content-muted">{{ item.postsCount }}</span>
              </div>
              <span class="text-[10px] text-content-secondary uppercase tracking-wider">{{ item.category }}</span>
            </a>
          }
        </div>
      </section>

      <!-- CARD 3: Businesses to Follow -->
      <section class="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-card">
        <div class="flex items-center justify-between pb-3 border-b border-border-subtle">
          <h2 class="text-sm font-bold text-content-primary">Businesses to Follow</h2>
          <a routerLink="/businesses" class="text-xs font-medium text-brand-600 hover:text-brand-700">Explore</a>
        </div>

        <div class="mt-3 space-y-3">
          @for (biz of businesses(); track biz.id) {
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-brand-50 flex items-center justify-center border border-border-subtle">
                  <img [src]="biz.logo" [alt]="biz.name" class="h-full w-full object-cover" loading="lazy" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1">
                    <p class="truncate text-xs font-semibold text-content-primary">{{ biz.name }}</p>
                    @if (biz.isVerified) {
                      <app-verification-badge type="business" />
                    }
                  </div>
                  <p class="truncate text-[11px] text-content-secondary">{{ biz.industry }} · {{ biz.location }}</p>
                </div>
              </div>

              <button
                type="button"
                (click)="toggleFollowBusiness(biz.id)"
                class="shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none"
                [class.bg-brand-50]="biz.following"
                [class.text-brand-700]="biz.following"
                [class.border]="!biz.following"
                [class.border-border-subtle]="!biz.following"
                [class.hover:border-brand-500]="!biz.following"
                [class.text-content-primary]="!biz.following"
              >
                {{ biz.following ? 'Following' : 'Follow' }}
              </button>
            </div>
          }
        </div>
      </section>

      <!-- CARD 4: Upcoming in UAE -->
      <section class="rounded-2xl border border-border-subtle bg-surface-secondary/50 p-4">
        <h2 class="text-xs font-bold uppercase tracking-wider text-content-muted">Upcoming in UAE</h2>
        <div class="mt-2.5 space-y-2.5">
          <div class="flex items-start gap-2.5">
            <div class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white border border-border-subtle text-center">
              <span class="text-[9px] font-bold text-brand-600 uppercase">Nov</span>
              <span class="text-xs font-bold text-content-primary">12</span>
            </div>
            <div>
              <p class="text-xs font-semibold text-content-primary">UAE Tech & AI Summit 2026</p>
              <p class="text-[11px] text-content-secondary">Dubai Internet City · 1,420 attending</p>
            </div>
          </div>

          <div class="flex items-start gap-2.5">
            <div class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white border border-border-subtle text-center">
              <span class="text-[9px] font-bold text-brand-600 uppercase">Nov</span>
              <span class="text-xs font-bold text-content-primary">24</span>
            </div>
            <div>
              <p class="text-xs font-semibold text-content-primary">Abu Dhabi Founder Circle</p>
              <p class="text-[11px] text-content-secondary">ADGM Hub · 380 attending</p>
            </div>
          </div>
        </div>
      </section>
    </aside>
  `,
})
export class RightSidebarComponent {
  readonly suggestedUsers = signal<SuggestedUser[]>([
    {
      id: 201,
      name: 'Ahmed Al Mansoori',
      role: 'Product Manager',
      location: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      connected: false,
    },
    {
      id: 202,
      name: 'Sara Hassan',
      role: 'Founder & CEO',
      location: 'Abu Dhabi',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
      isVerified: true,
      connected: false,
    },
    {
      id: 203,
      name: 'David Wilson',
      role: 'Solutions Architect',
      location: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
      isVerified: false,
      connected: false,
    },
  ]);

  readonly trendingTags: TrendingTag[] = [
    { tag: '#DubaiTech', category: 'Technology', postsCount: '1.4k posts' },
    { tag: '#UAEStartups', category: 'Business', postsCount: '980 posts' },
    { tag: '#ArtificialIntelligence', category: 'Innovation', postsCount: '2.1k posts' },
    { tag: '#Entrepreneurship', category: 'Community', postsCount: '740 posts' },
    { tag: '#AbuDhabi', category: 'Region', postsCount: '1.8k posts' },
  ];

  readonly businesses = signal<FollowBusiness[]>([
    {
      id: 301,
      name: 'Emirates Digital Labs',
      industry: 'Technology',
      location: 'Dubai',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
      isVerified: true,
      following: false,
    },
    {
      id: 302,
      name: 'Desert Cloud Technologies',
      industry: 'Cloud & AI',
      location: 'Abu Dhabi',
      logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=120&q=80',
      isVerified: true,
      following: false,
    },
    {
      id: 303,
      name: 'Dubai Founders Hub',
      industry: 'Startup Ecosystem',
      location: 'Dubai',
      logo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=120&q=80',
      isVerified: true,
      following: false,
    },
  ]);

  toggleConnect(id: number): void {
    this.suggestedUsers.update((users) =>
      users.map((u) => (u.id === id ? { ...u, connected: !u.connected } : u)),
    );
  }

  toggleFollowBusiness(id: number): void {
    this.businesses.update((items) =>
      items.map((b) => (b.id === id ? { ...b, following: !b.following } : b)),
    );
  }
}
