import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, map, Subject } from 'rxjs';

import { ProfileService } from '../../core/profile/profile.service';
import { SearchFilters, SearchResult, SearchType } from '../../core/search/search.models';
import { SearchService } from '../../core/search/search.service';

@Component({
  selector: 'app-search-page',
  imports: [RouterLink, TitleCasePipe],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <a routerLink="/" class="text-sm font-medium text-brand-strong">← Home</a>
        <header class="mt-6 rounded-3xl bg-surface-card p-6 shadow-card sm:p-8">
          <p class="text-sm font-medium uppercase tracking-[0.18em] text-brand-strong">Discover</p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight">Search people and businesses</h1>
          <label class="mt-6 block text-sm font-medium" for="search-query">Search</label>
          <div class="mt-2 flex flex-col gap-3 sm:flex-row">
            <input id="search-query" type="search" [value]="query()" (input)="onQuery($event)" (keydown.enter)="submitQuery()" placeholder="Search by name, headline or business" class="auth-input mt-0 flex-1" />
            <button type="button" class="rounded-xl bg-brand-primary px-5 py-3 font-medium text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary" (click)="submitQuery()">Search</button>
          </div>
          <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <fieldset class="sm:col-span-2 lg:col-span-1"><legend class="text-sm font-medium">Type</legend><div class="mt-2 flex flex-wrap gap-2" role="group" aria-label="Search type">@for (option of typeOptions; track option.value) { <button type="button" [attr.aria-pressed]="type() === option.value" [class.bg-brand-primary]="type() === option.value" [class.text-white]="type() === option.value" class="rounded-xl border border-border-subtle px-3 py-2 text-sm font-medium hover:border-brand-primary" (click)="setType(option.value)">{{ option.label }}</button> }</div></fieldset>
            <label class="block text-sm font-medium">Industry<select class="auth-input" [value]="industry()" (change)="setFilter('industry', value($event))"><option value="">All industries</option>@for (option of industries(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label>
            <label class="block text-sm font-medium">Emirate<select class="auth-input" [value]="emirate()" (change)="setFilter('emirate', value($event))"><option value="">All emirates</option>@for (option of emirates(); track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label>
            <label class="block text-sm font-medium">Verification<select class="auth-input" [value]="verifiedValue()" (change)="setVerified(value($event))"><option value="">All profiles</option><option value="true">Verified only</option><option value="false">Unverified only</option></select></label>
          </div>
          @if (hasFilters()) { <button type="button" class="mt-4 text-sm font-medium text-brand-strong hover:underline" (click)="clearFilters()">Clear filters</button> }
        </header>

        @if (error()) { <section class="mt-6 rounded-3xl border border-status-danger/25 bg-surface-card p-8 text-center" role="alert"><h2 class="text-xl font-bold">{{ error() }}</h2><button type="button" class="mt-4 rounded-xl border border-border-subtle px-4 py-2 text-sm font-medium" (click)="retry()">Retry</button></section> }
        @if (loading()) { <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading search results" aria-live="polite">@for (item of skeletons; track item) { <div class="h-44 animate-pulse rounded-2xl bg-surface-muted"></div> }</div> }
        @else if (!error() && !results().length) { <section class="mt-6 rounded-3xl bg-surface-card p-10 text-center shadow-card"><h2 class="text-xl font-bold">No results found.</h2><p class="mt-2 text-content-secondary">Try changing your search or filters.</p></section> }
        @else if (!error()) { <section class="mt-6" aria-live="polite"><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">@for (result of results(); track result.type + ':' + result.id) { @if (result.type === 'user') { <a [routerLink]="['/users', result.id]" class="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"><div class="flex items-start gap-3"><div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (result.avatar_url) { <img [src]="result.avatar_url" [alt]="(result.display_name || 'User') + ' profile photo'" class="h-full w-full object-cover" /> } @else { {{ initials(result.display_name || 'User') }} }</div><div class="min-w-0"><h2 class="flex flex-wrap items-center gap-2 font-semibold">{{ result.display_name || 'Unnamed professional' }} @if (result.is_verified) { <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong" aria-label="Verified profile">✓ Verified</span> }</h2><p class="mt-1 line-clamp-2 text-sm text-content-secondary">{{ result.headline || 'Professional profile' }}</p></div></div><p class="mt-4 text-xs text-content-muted">{{ result.industry | titlecase }} @if (result.industry && result.emirate) { · } {{ result.emirate | titlecase }}</p></a> } @else { <a [routerLink]="['/businesses', result.slug]" class="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"><div class="flex items-start gap-3"><div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (result.logo_url) { <img [src]="result.logo_url" [alt]="result.name + ' logo'" class="h-full w-full object-cover" /> } @else { {{ initials(result.name) }} }</div><div class="min-w-0"><h2 class="flex flex-wrap items-center gap-2 font-semibold">{{ result.name }} @if (result.is_verified) { <span class="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong" aria-label="Verified business">✓ Verified</span> }</h2><p class="mt-1 line-clamp-3 text-sm text-content-secondary">{{ result.description || 'Business page' }}</p></div></div><p class="mt-4 text-xs text-content-muted">{{ result.industry | titlecase }} @if (result.industry && result.emirate) { · } {{ result.emirate | titlecase }}</p></a> } }</div>@if (loadMoreError()) { <div class="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-status-danger" role="alert"><span>Couldn’t load more results.</span><button type="button" class="font-medium underline" (click)="loadMore()">Retry</button></div> }@if (hasMore()) { <div class="mt-6 text-center"><button type="button" class="rounded-xl border border-border-subtle bg-surface-card px-5 py-3 text-sm font-medium hover:border-brand-primary disabled:cursor-wait disabled:opacity-60" [disabled]="loadingMore()" (click)="loadMore()">{{ loadingMore() ? 'Loading…' : 'Load more' }}</button></div> }</section> }
      </div>
    </main>
  `,
})
export class SearchPageComponent {
  readonly search = inject(SearchService);
  readonly profile = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryChanges = new Subject<string>();

  readonly query = signal('');
  readonly type = signal<SearchType>('all');
  readonly industry = signal('');
  readonly emirate = signal('');
  readonly verified = signal<boolean | undefined>(undefined);
  readonly results = signal<SearchResult[]>([]);
  readonly pagination = signal<SearchFilters['page'] | null>(null);
  readonly lastPage = signal(1);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly loadMoreError = signal(false);
  readonly industries = this.profile.industries;
  readonly emirates = this.profile.emirates;
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  readonly typeOptions: Array<{ value: SearchType; label: string }> = [
    { value: 'all', label: 'All' }, { value: 'users', label: 'People' }, { value: 'businesses', label: 'Businesses' },
  ];
  private requestVersion = 0;

  constructor() {
    this.profile.getIndustries().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.profile.getEmirates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.queryChanges.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe((query) => this.updateUrl({ q: query || null, page: null }));
    this.route.queryParamMap.pipe(
      map((params) => this.filtersFromUrl(params)),
      distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((filters) => {
      this.query.set(filters.q ?? '');
      this.type.set(filters.type);
      this.industry.set(filters.industry ?? '');
      this.emirate.set(filters.emirate ?? '');
      this.verified.set(filters.verified);
      if (filters.q && filters.q.length < 2) {
        ++this.requestVersion;
        this.loading.set(false);
        this.loadingMore.set(false);
        this.results.set([]);
        this.error.set('Enter at least 2 characters to search.');
        return;
      }
      this.load(filters);
    });
  }

  onQuery(event: Event): void { const query = (event.target as HTMLInputElement).value; this.query.set(query); this.queryChanges.next(query); }
  submitQuery(): void { this.updateUrl({ q: this.query().trim() || null, page: null }); }
  setType(type: SearchType): void { this.updateUrl({ type: type === 'all' ? null : type, page: null }); }
  setFilter(name: 'industry' | 'emirate', value: string): void { this.updateUrl({ [name]: value || null, page: null }); }
  setVerified(value: string): void { this.updateUrl({ verified: value || null, page: null }); }
  clearFilters(): void { this.updateUrl({ type: null, industry: null, emirate: null, verified: null, page: null }); }
  retry(): void { this.load(this.currentFilters()); }
  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    const version = this.requestVersion;
    this.loadingMore.set(true);
    this.loadMoreError.set(false);
    this.request(this.currentFilters({ page: this.lastPage() + 1 })).pipe(finalize(() => { if (version === this.requestVersion) this.loadingMore.set(false); })).subscribe({
      next: (response) => { if (version === this.requestVersion) { this.results.update((current) => this.merge(current, response.data)); this.pagination.set(response.meta.current_page); this.lastPage.set(response.meta.last_page); } },
      error: () => { if (version === this.requestVersion) this.loadMoreError.set(true); },
    });
  }

  hasFilters(): boolean { return this.type() !== 'all' || !!this.industry() || !!this.emirate() || this.verified() !== undefined; }
  verifiedValue(): string { return this.verified() === undefined ? '' : String(this.verified()); }
  hasMore(): boolean { return this.lastPage() > 1 && this.pagination() !== null && (this.pagination() as number) < this.lastPage(); }
  value(event: Event): string { return (event.target as HTMLSelectElement).value; }
  initials(value: string): string { return value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

  private load(filters: SearchFilters): void {
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.loadingMore.set(false);
    this.loadMoreError.set(false);
    this.error.set('');
    this.request(filters).pipe(finalize(() => { if (version === this.requestVersion) this.loading.set(false); })).subscribe({
      next: (response) => { if (version === this.requestVersion) { this.results.set(response.data); this.pagination.set(response.meta.current_page); this.lastPage.set(response.meta.last_page); } },
      error: (error: unknown) => { if (version === this.requestVersion) { this.results.set([]); this.error.set(this.search.errorMessage(error)); } },
    });
  }

  private request(filters: SearchFilters) {
    return filters.type === 'users' ? this.search.searchUsers(filters) : filters.type === 'businesses' ? this.search.searchBusinesses(filters) : this.search.search(filters);
  }

  private currentFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
    return { q: this.query() || undefined, type: this.type(), industry: this.industry() || undefined, emirate: this.emirate() || undefined, verified: this.verified(), page: 1, ...overrides };
  }

  private filtersFromUrl(params: import('@angular/router').ParamMap): SearchFilters {
    const type = params.get('type');
    const verified = params.get('verified');
    return { q: params.get('q')?.trim() || undefined, type: type === 'users' || type === 'businesses' ? type : 'all', industry: params.get('industry') || undefined, emirate: params.get('emirate') || undefined, verified: verified === 'true' ? true : verified === 'false' ? false : undefined, page: Math.max(1, Number(params.get('page')) || 1) };
  }

  private updateUrl(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  private merge(current: SearchResult[], additions: SearchResult[]): SearchResult[] {
    const seen = new Set(current.map((item) => `${item.type}:${item.id}`));
    return [...current, ...additions.filter((item) => !seen.has(`${item.type}:${item.id}`))];
  }
}
