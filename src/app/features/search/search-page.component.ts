import { TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, map, Subject } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SearchFilters, SearchResult, SearchType } from '../../core/search/search.models';
import { SearchService } from '../../core/search/search.service';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';

@Component({
  selector: 'app-search-page',
  imports: [
    RouterLink,
    TitleCasePipe,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Sticky Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Responsive Shell Container (max 1440px) -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Navigation Rail (240px, sticky, Discover active) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Discovery Content Column -->
        <main class="w-full max-w-[1080px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Application Shell Top Global Header -->
          <section aria-label="Global application bar" class="flex items-center justify-between gap-3 sm:gap-4">
            <!-- Global Shell Search -->
            <div class="relative flex-1 max-w-xl">
              <label for="global-shell-search" class="sr-only">Search people, businesses and posts</label>
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                id="global-shell-search"
                type="search"
                (keydown.enter)="onGlobalSearch($event)"
                placeholder="Search people, businesses and posts"
                class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-content-primary placeholder:text-content-muted shadow-card transition-all duration-150 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
            </div>

            <!-- Global Action Controls -->
            <div class="flex items-center gap-2 sm:gap-3">
              <a
                routerLink="/"
                class="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Create a new post"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span class="hidden sm:inline">Create</span>
              </a>

              <a
                routerLink="/notifications"
                class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-white text-content-secondary shadow-card transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Notifications"
                title="Notifications"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white"></span>
              </a>

              <a
                routerLink="/profile"
                class="flex items-center gap-2 rounded-xl border border-border-subtle bg-white p-1 sm:pr-3 shadow-card transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Your Profile"
              >
                <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                  @if (profile.profile()?.avatar_url) {
                    <img [src]="profile.profile()?.avatar_url" alt="" class="h-full w-full object-cover" />
                  } @else {
                    {{ initials(profile.profile()?.display_name || auth.currentUser()?.name || '') }}
                  }
                </div>
                <span class="hidden text-xs font-medium text-content-primary lg:inline max-w-[110px] truncate">
                  {{ profile.profile()?.display_name || auth.currentUser()?.name }}
                </span>
              </a>
            </div>
          </section>

          <!-- Discover Page Header Banner -->
          <header class="space-y-1.5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Discover UAE</p>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
              Search people and businesses
            </h1>
            <p class="text-sm text-content-secondary max-w-2xl">
              Find professionals, registered businesses, and ecosystem leaders across all Emirates.
            </p>
          </header>

          <!-- Search & Filter Controls Bento Surface -->
          <section aria-label="Search and filter options" class="rounded-2xl border border-border-subtle bg-surface-card p-4 sm:p-6 shadow-card space-y-4">
            <!-- Dedicated Discovery Search Bar (52px height, clear reset button) -->
            <div class="flex flex-col gap-2.5 sm:flex-row">
              <div class="relative flex-1">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-content-muted">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <label for="search-query" class="sr-only">Search</label>
                <input
                  id="search-query"
                  type="search"
                  [value]="query()"
                  (input)="onQuery($event)"
                  (keydown.enter)="submitQuery()"
                  placeholder="Search people, roles, businesses or keywords…"
                  class="h-12 sm:h-13 w-full rounded-xl border border-border-subtle bg-white pl-11 pr-10 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                />
                @if (query()) {
                  <button
                    type="button"
                    (click)="clearQuery()"
                    class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted hover:text-content-primary transition-colors focus:outline-none"
                    title="Clear search query"
                    aria-label="Clear query"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                }
              </div>

              <button
                type="button"
                [disabled]="loading()"
                (click)="submitQuery()"
                class="inline-flex h-12 sm:h-13 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                @if (loading()) {
                  <svg class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Searching…</span>
                } @else {
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Search</span>
                }
              </button>
            </div>

            <!-- Responsive Filter Toolbar (Type, Industry, Emirate, Verification) -->
            <div class="grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4">
              <!-- Type Segmented Control -->
              <fieldset class="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <legend class="text-xs font-semibold uppercase tracking-wider text-content-secondary">Type</legend>
                <div class="inline-flex h-11 w-full rounded-xl border border-border-subtle bg-surface-secondary/70 p-1" role="group" aria-label="Search type">
                  @for (option of typeOptions; track option.value) {
                    <button
                      type="button"
                      [attr.aria-pressed]="type() === option.value"
                      (click)="setType(option.value)"
                      class="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none"
                      [class.bg-brand-500]="type() === option.value"
                      [class.text-white]="type() === option.value"
                      [class.shadow-xs]="type() === option.value"
                      [class.text-content-secondary]="type() !== option.value"
                      [class.hover:text-content-primary]="type() !== option.value"
                    >
                      {{ option.label }}
                    </button>
                  }
                </div>
              </fieldset>

              <!-- Industry Select -->
              <div class="space-y-1.5">
                <label for="filter-industry" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Industry
                </label>
                <div class="relative">
                  <select
                    id="filter-industry"
                    aria-label="Industry"
                    [value]="industry()"
                    (change)="setFilter('industry', value($event))"
                    class="h-11 w-full appearance-none rounded-xl border border-border-subtle bg-white pl-3.5 pr-10 text-xs sm:text-sm text-content-primary shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 cursor-pointer"
                  >
                    <option value="">All industries</option>
                    @for (option of industries(); track option.value) {
                      <option [value]="option.value" [selected]="industry() === option.value">{{ option.label }}</option>
                    }
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Emirate Select -->
              <div class="space-y-1.5">
                <label for="filter-emirate" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Emirate
                </label>
                <div class="relative">
                  <select
                    id="filter-emirate"
                    aria-label="Emirate"
                    [value]="emirate()"
                    (change)="setFilter('emirate', value($event))"
                    class="h-11 w-full appearance-none rounded-xl border border-border-subtle bg-white pl-3.5 pr-10 text-xs sm:text-sm text-content-primary shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 cursor-pointer"
                  >
                    <option value="">All emirates</option>
                    @for (option of emirates(); track option.value) {
                      <option [value]="option.value" [selected]="emirate() === option.value">{{ option.label }}</option>
                    }
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Verification Select -->
              <div class="space-y-1.5">
                <label for="filter-verification" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                  Verification
                </label>
                <div class="relative">
                  <select
                    id="filter-verification"
                    aria-label="Verification"
                    [value]="verifiedValue()"
                    (change)="setVerified(value($event))"
                    class="h-11 w-full appearance-none rounded-xl border border-border-subtle bg-white pl-3.5 pr-10 text-xs sm:text-sm text-content-primary shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 cursor-pointer"
                  >
                    <option value="">All profiles</option>
                    <option value="true">Verified only</option>
                    <option value="false">Unverified only</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Filter Badges & Reset Action -->
            @if (hasFilters()) {
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
                <span class="text-xs font-medium text-content-muted">Active filters:</span>
                @if (type() !== 'all') {
                  <span class="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 border border-brand-200">
                    Type: {{ type() === 'users' ? 'People' : 'Businesses' }}
                    <button type="button" (click)="setType('all')" class="hover:text-brand-900 ml-0.5" aria-label="Remove type filter">×</button>
                  </span>
                }
                @if (industry()) {
                  <span class="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 border border-brand-200">
                    {{ industry() | titlecase }}
                    <button type="button" (click)="setFilter('industry', '')" class="hover:text-brand-900 ml-0.5" aria-label="Remove industry filter">×</button>
                  </span>
                }
                @if (emirate()) {
                  <span class="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 border border-brand-200">
                    {{ emirate() | titlecase }}
                    <button type="button" (click)="setFilter('emirate', '')" class="hover:text-brand-900 ml-0.5" aria-label="Remove emirate filter">×</button>
                  </span>
                }
                @if (verified() !== undefined) {
                  <span class="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 border border-brand-200">
                    {{ verified() ? 'Verified only' : 'Unverified only' }}
                    <button type="button" (click)="setVerified('')" class="hover:text-brand-900 ml-0.5" aria-label="Remove verification filter">×</button>
                  </span>
                }
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline ml-1"
                >
                  Clear filters
                </button>
              </div>
            }
          </section>

          <!-- Results Summary Header -->
          @if (!loading() && !error() && results().length > 0) {
            <div class="flex items-center justify-between text-xs sm:text-sm text-content-secondary px-1">
              <p>
                Showing <span class="font-semibold text-content-primary">{{ results().length }}</span>
                @if (total() !== null && total()! > results().length) {
                  of <span class="font-semibold text-content-primary">{{ total() }}</span>
                }
                results
                @if (query()) {
                  for "<span class="font-semibold text-content-primary">{{ query() }}</span>"
                }
              </p>
              <span class="text-xs text-content-muted">Sorted by relevance</span>
            </div>
          }

          <!-- Error Alert State -->
          @if (error()) {
            <section class="rounded-3xl border border-status-danger/25 bg-surface-card p-8 text-center shadow-card space-y-3" role="alert">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger/10 text-status-danger">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-content-primary">{{ error() }}</h2>
              <p class="text-sm text-content-secondary">We couldn't load discovery results. Please try again.</p>
              <div class="pt-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-content-primary hover:border-brand-500 transition-colors"
                  (click)="retry()"
                >
                  Retry
                </button>
              </div>
            </section>
          }

          <!-- Skeletons State (6 Realistic Bento Result Cards with Shimmer) -->
          @if (loading()) {
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading search results" aria-live="polite">
              @for (item of skeletons; track item) {
                <div class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card animate-pulse">
                  <div class="h-16 bg-surface-secondary"></div>
                  <div class="p-5 pt-0">
                    <div class="-mt-8 h-16 w-16 rounded-full border-4 border-surface-card bg-surface-muted"></div>
                    <div class="mt-3.5 h-4 w-3/4 rounded-md bg-surface-muted"></div>
                    <div class="mt-2 h-3.5 w-full rounded-md bg-surface-muted"></div>
                    <div class="mt-1.5 h-3.5 w-2/3 rounded-md bg-surface-muted"></div>
                    <div class="mt-5 flex gap-2">
                      <div class="h-8 flex-1 rounded-xl bg-surface-muted"></div>
                      <div class="h-8 flex-1 rounded-xl bg-surface-muted"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Empty State (No Results) -->
          @else if (!error() && !results().length) {
            <section class="rounded-3xl border border-border-subtle bg-surface-card p-10 text-center shadow-card space-y-3">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-content-primary">No results found.</h2>
              <p class="text-sm text-content-secondary max-w-md mx-auto">
                We couldn't find professionals or businesses matching your filters. Try adjusting your search query or clearing some filters.
              </p>
              @if (hasFilters() || query()) {
                <div class="pt-2">
                  <button
                    type="button"
                    (click)="clearFilters()"
                    class="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-brand-600 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              }
            </section>
          }

          <!-- Results Grid (3-column on desktop, 2-column on tablet, 1-column on mobile) -->
          @else if (!error()) {
            <section aria-label="Search results" aria-live="polite">
              <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                @for (result of results(); track result.type + ':' + result.id) {
                  @if (result.type === 'user') {
                    <!-- Person Card -->
                    <a
                      [routerLink]="['/users', result.id]"
                      class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-brand-primary"
                    >
                      <!-- Decorative Top Strip -->
                      <div class="h-16 w-full bg-linear-to-r from-brand-100 via-brand-50 to-brand-200"></div>

                      <div class="p-5 pt-0 flex flex-col flex-1 justify-between">
                        <div>
                          <!-- Overlapping Circular Avatar -->
                          <div class="-mt-8 relative mb-3 inline-block">
                            <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-3 border-surface-card bg-brand-500 text-lg font-bold text-white shadow-xs">
                              @if (result.avatar_url) {
                                <img [src]="result.avatar_url" [alt]="(result.display_name || 'User') + ' profile photo'" class="h-full w-full object-cover" />
                              } @else {
                                {{ initials(result.display_name || 'User') }}
                              }
                            </div>
                          </div>

                          <!-- Name and Verification -->
                          <h2 class="flex flex-wrap items-center gap-1.5 text-base font-bold text-content-primary group-hover:text-brand-600 transition-colors">
                            <span class="truncate max-w-[200px]">{{ result.display_name || 'Unnamed professional' }}</span>
                            @if (result.is_verified) {
                              <span class="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200" aria-label="Verified profile">
                                <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  <polyline points="9 12 11 14 15 10" />
                                </svg>
                                Verified
                              </span>
                            }
                          </h2>

                          <!-- Headline -->
                          <p class="mt-1 line-clamp-2 text-xs sm:text-sm text-content-secondary leading-snug">
                            {{ result.headline || 'Professional profile' }}
                          </p>

                          <!-- UAE Industry & Emirate Badges -->
                          <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-content-muted">
                            @if (result.emirate) {
                              <span class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                                <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                {{ result.emirate | titlecase }}
                              </span>
                            }
                            @if (result.industry) {
                              <span class="inline-flex items-center rounded-md bg-surface-secondary px-2 py-0.5 font-medium text-content-secondary">
                                {{ result.industry | titlecase }}
                              </span>
                            }
                          </div>
                        </div>

                        <!-- Card Action Strip -->
                        <div class="mt-5 flex items-center gap-2 pt-3 border-t border-border-subtle">
                          <span class="flex-1 rounded-xl bg-brand-50 py-1.5 text-center text-xs font-semibold text-brand-700 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                            View Profile
                          </span>
                        </div>
                      </div>
                    </a>
                  } @else {
                    <!-- Business Card -->
                    <a
                      [routerLink]="['/businesses', result.slug]"
                      class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-brand-primary"
                    >
                      <!-- Decorative Top Strip -->
                      <div class="h-16 w-full bg-linear-to-r from-surface-secondary via-brand-50 to-brand-100"></div>

                      <div class="p-5 pt-0 flex flex-col flex-1 justify-between">
                        <div>
                          <!-- Overlapping Rounded Logo -->
                          <div class="-mt-8 relative mb-3 inline-block">
                            <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-3 border-surface-card bg-surface-secondary text-lg font-bold text-brand-700 shadow-xs">
                              @if (result.logo_url) {
                                <img [src]="result.logo_url" [alt]="result.name + ' logo'" class="h-full w-full object-cover" />
                              } @else {
                                {{ initials(result.name) }}
                              }
                            </div>
                          </div>

                          <!-- Business Name and Verification -->
                          <h2 class="flex flex-wrap items-center gap-1.5 text-base font-bold text-content-primary group-hover:text-brand-600 transition-colors">
                            <span class="truncate max-w-[200px]">{{ result.name }}</span>
                            @if (result.is_verified) {
                              <span class="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 border border-brand-200" aria-label="Verified business">
                                <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  <polyline points="9 12 11 14 15 10" />
                                </svg>
                                Verified
                              </span>
                            }
                          </h2>

                          <!-- Description -->
                          <p class="mt-1 line-clamp-2 text-xs sm:text-sm text-content-secondary leading-snug">
                            {{ result.description || 'Verified UAE enterprise' }}
                          </p>

                          <!-- UAE Industry & Emirate Badges -->
                          <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-content-muted">
                            @if (result.emirate) {
                              <span class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                                <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                {{ result.emirate | titlecase }}
                              </span>
                            }
                            @if (result.industry) {
                              <span class="inline-flex items-center rounded-md bg-surface-secondary px-2 py-0.5 font-medium text-content-secondary">
                                {{ result.industry | titlecase }}
                              </span>
                            }
                          </div>
                        </div>

                        <!-- Card Action Strip -->
                        <div class="mt-5 flex items-center gap-2 pt-3 border-t border-border-subtle">
                          <span class="flex-1 rounded-xl bg-surface-secondary py-1.5 text-center text-xs font-semibold text-content-primary transition-colors group-hover:bg-brand-500 group-hover:text-white">
                            View Business
                          </span>
                        </div>
                      </div>
                    </a>
                  }
                }
              </div>

              <!-- Pagination / Load More Error -->
              @if (loadMoreError()) {
                <div class="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-status-danger" role="alert">
                  <span>Couldn’t load more results.</span>
                  <button type="button" class="font-medium underline hover:text-status-danger/80" (click)="loadMore()">
                    Retry
                  </button>
                </div>
              }

              <!-- Pagination / Load More Action -->
              @if (hasMore()) {
                <div class="mt-8 text-center">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-card px-6 py-2.5 text-sm font-semibold text-content-primary shadow-xs hover:border-brand-500 hover:text-brand-600 transition-all disabled:cursor-wait disabled:opacity-60"
                    [disabled]="loadingMore()"
                    (click)="loadMore()"
                  >
                    @if (loadingMore()) {
                      <svg class="h-4 w-4 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      <span>Loading…</span>
                    } @else {
                      <span>Load more</span>
                    }
                  </button>
                </div>
              }
            </section>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation (<= 768px, Discover active) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class SearchPageComponent {
  readonly search = inject(SearchService);
  readonly profile = inject(ProfileService);
  readonly auth = inject(AuthService);
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
  readonly total = signal<number | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly loadMoreError = signal(false);
  readonly industries = this.profile.industries;
  readonly emirates = this.profile.emirates;
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  readonly typeOptions: Array<{ value: SearchType; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'users', label: 'People' },
    { value: 'businesses', label: 'Businesses' },
  ];
  private requestVersion = 0;

  constructor() {
    this.profile.getIndustries().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.profile.getEmirates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.queryChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => this.updateUrl({ q: query || null, page: null }));
    this.route.queryParamMap
      .pipe(
        map((params) => this.filtersFromUrl(params)),
        distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filters) => {
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

  onQuery(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.query.set(query);
    this.queryChanges.next(query);
  }

  clearQuery(): void {
    this.query.set('');
    this.updateUrl({ q: null, page: null });
  }

  submitQuery(): void {
    this.updateUrl({ q: this.query().trim() || null, page: null });
  }

  onGlobalSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value.trim();
    if (query) {
      this.query.set(query);
      this.updateUrl({ q: query, page: null });
    }
  }

  setType(type: SearchType): void {
    this.updateUrl({ type: type === 'all' ? null : type, page: null });
  }

  setFilter(name: 'industry' | 'emirate', value: string): void {
    this.updateUrl({ [name]: value || null, page: null });
  }

  setVerified(value: string): void {
    this.updateUrl({ verified: value || null, page: null });
  }

  clearFilters(): void {
    this.updateUrl({ type: null, industry: null, emirate: null, verified: null, page: null });
  }

  retry(): void {
    this.load(this.currentFilters());
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    const version = this.requestVersion;
    this.loadingMore.set(true);
    this.loadMoreError.set(false);
    this.request(this.currentFilters({ page: (this.pagination() ?? 1) + 1 }))
      .pipe(
        finalize(() => {
          if (version === this.requestVersion) this.loadingMore.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          if (version === this.requestVersion) {
            this.results.update((current) => this.merge(current, response.data));
            this.pagination.set(response.meta.current_page);
            this.lastPage.set(response.meta.last_page);
            this.total.set(response.meta.total);
          }
        },
        error: () => {
          if (version === this.requestVersion) this.loadMoreError.set(true);
        },
      });
  }

  logout(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  hasFilters(): boolean {
    return this.type() !== 'all' || !!this.industry() || !!this.emirate() || this.verified() !== undefined;
  }

  verifiedValue(): string {
    return this.verified() === undefined ? '' : String(this.verified());
  }

  hasMore(): boolean {
    return this.lastPage() > 1 && this.pagination() !== null && (this.pagination() as number) < this.lastPage();
  }

  value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  initials(value: string): string {
    return value
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private load(filters: SearchFilters): void {
    const version = ++this.requestVersion;
    this.loading.set(true);
    this.loadingMore.set(false);
    this.loadMoreError.set(false);
    this.error.set('');
    this.request(filters)
      .pipe(
        finalize(() => {
          if (version === this.requestVersion) this.loading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          if (version === this.requestVersion) {
            this.results.set(response.data);
            this.pagination.set(response.meta.current_page);
            this.lastPage.set(response.meta.last_page);
            this.total.set(response.meta.total);
          }
        },
        error: (error: unknown) => {
          if (version === this.requestVersion) {
            this.results.set([]);
            this.error.set(this.search.errorMessage(error));
          }
        },
      });
  }

  private request(filters: SearchFilters) {
    return filters.type === 'users'
      ? this.search.searchUsers(filters)
      : filters.type === 'businesses'
        ? this.search.searchBusinesses(filters)
        : this.search.search(filters);
  }

  private currentFilters(overrides: Partial<SearchFilters> = {}): SearchFilters {
    return {
      q: this.query() || undefined,
      type: this.type(),
      industry: this.industry() || undefined,
      emirate: this.emirate() || undefined,
      verified: this.verified(),
      page: 1,
      ...overrides,
    };
  }

  private filtersFromUrl(params: import('@angular/router').ParamMap): SearchFilters {
    const type = params.get('type');
    const verified = params.get('verified');
    return {
      q: params.get('q')?.trim() || undefined,
      type: type === 'users' || type === 'businesses' ? type : 'all',
      industry: params.get('industry') || undefined,
      emirate: params.get('emirate') || undefined,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      page: Math.max(1, Number(params.get('page')) || 1),
    };
  }

  private updateUrl(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  private merge(current: SearchResult[], additions: SearchResult[]): SearchResult[] {
    const seen = new Set(current.map((item) => `${item.type}:${item.id}`));
    return [...current, ...additions.filter((item) => !seen.has(`${item.type}:${item.id}`))];
  }
}
