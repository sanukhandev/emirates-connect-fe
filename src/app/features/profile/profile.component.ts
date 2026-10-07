import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { PostService } from '../../core/post/post.service';
import { PostCardComponent } from '../../shared/components/post-card.component';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TitleCasePipe,
    PostCardComponent,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Desktop Shell Container (max 1440px) -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Navigation Rail (sticky, 240-256px) -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[920px] shrink min-w-0 space-y-6 pb-20 md:pb-10">

          <!-- Breadcrumb & Mode Action Bar -->
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-card px-5 py-3.5 shadow-card">
            <div class="flex items-center gap-2.5 text-sm">
              @if (editMode) {
                <a routerLink="/profile" class="inline-flex items-center gap-1.5 font-medium text-content-secondary transition-colors hover:text-brand-600">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Profile
                </a>
                <span class="text-border-subtle">/</span>
                <span class="font-bold text-content-primary">Edit Profile</span>
              } @else {
                <a routerLink="/" class="text-content-secondary transition-colors hover:text-brand-600">Home</a>
                <span class="text-border-subtle">/</span>
                <span class="font-bold text-content-primary">My Profile</span>
              }
            </div>

            <div class="flex items-center gap-2.5">
              @if (editMode) {
                <a
                  routerLink="/profile"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-1.5 text-xs font-semibold text-content-secondary shadow-xs transition-colors hover:border-brand-500 hover:text-brand-600"
                >
                  <svg class="h-3.5 w-3.5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View Profile
                </a>
              } @else {
                <a
                  routerLink="/profile/edit"
                  class="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-600"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </a>
              }
            </div>
          </div>

          <!-- Profile Loading Skeleton -->
          @if (profile.isLoading() && !profile.profile()) {
            <div class="space-y-4">
              <div class="h-64 animate-pulse rounded-3xl bg-surface-muted"></div>
              <div class="h-48 animate-pulse rounded-3xl bg-surface-muted"></div>
            </div>
          }

          <!-- Main Profile Card & Content -->
          @if (profile.profile(); as value) {
            <section class="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-card">
              <!-- Cover Banner & Avatar Wrapper -->
              <div class="relative">
                <!-- Cover Banner with Modern Gradient Fallback -->
                <div class="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-linear-to-r from-brand-100 via-brand-50 to-brand-200">
                  @if (value.cover_image_url) {
                    <img [src]="value.cover_image_url" alt="" class="h-full w-full object-cover" />
                  } @else {
                    <div class="absolute inset-0 opacity-30">
                      <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none">
                        <defs>
                          <pattern id="ec-mesh" width="36" height="36" patternUnits="userSpaceOnUse">
                            <path d="M0 36L36 0M0 0l36 36" stroke="#9470f8" stroke-width="0.75" stroke-opacity="0.3" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#ec-mesh)" />
                      </svg>
                    </div>
                  }
                  <div class="absolute inset-0 bg-gradient-to-t from-content-primary/40 via-transparent to-black/10 pointer-events-none"></div>

                  <!-- Floating Change Cover Trigger (Edit Mode) -->
                  @if (editMode) {
                    <div class="absolute top-4 right-4 z-10">
                      <label
                        for="cover-upload-input"
                        class="inline-flex items-center gap-1.5 cursor-pointer rounded-xl bg-white/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-content-primary shadow-card transition-all hover:bg-white hover:text-brand-600 focus-within:ring-2 focus-within:ring-brand-500"
                        title="Update cover photo"
                      >
                        <svg class="h-3.5 w-3.5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>Change Cover</span>
                      </label>
                    </div>
                  }
                </div>

                <!-- Avatar Hero (Overlapping Bottom Left with z-20 Elevation) -->
                <div class="absolute -bottom-12 sm:-bottom-14 left-6 sm:left-10 z-20">
                  <div class="group relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-full border-4 border-surface-card bg-brand-500 text-2xl sm:text-3xl font-bold text-white shadow-card">
                    @if (value.avatar_url) {
                      <img [src]="value.avatar_url" [alt]="(value.display_name || 'Profile') + ' profile photo'" class="h-full w-full object-cover" />
                    } @else {
                      {{ initials(value.display_name) }}
                    }

                    <!-- Camera Trigger Overlay on Avatar (Edit Mode) -->
                    @if (editMode) {
                      <label
                        for="avatar-upload-input"
                        class="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Upload new avatar"
                      >
                        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span class="text-[10px] font-medium mt-1">Change</span>
                      </label>
                    }
                  </div>

                  <!-- Floating Camera Badge (Edit Mode) -->
                  @if (editMode) {
                    <label
                      for="avatar-upload-input"
                      class="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white shadow-card hover:bg-brand-600 cursor-pointer transition-colors"
                      title="Upload photo"
                    >
                      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </label>
                  }
                </div>
              </div>

              <!-- Profile Details Header Strip -->
              <div class="relative px-6 pb-6 pt-16 sm:px-10 sm:pt-20">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 class="flex flex-wrap items-center gap-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                      {{ value.display_name || auth.currentUser()?.name }}
                      @if (value.is_verified) {
                        <span class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 border border-brand-200" aria-label="Verified profile">
                          <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <polyline points="9 12 11 14 15 10" />
                          </svg>
                          Verified
                        </span>
                      }
                    </h1>
                    <p class="mt-1 text-base text-content-secondary leading-snug">{{ value.headline }}</p>
                    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-content-muted">
                      @if (value.job_title) {
                        <span class="inline-flex items-center gap-1.5 text-content-secondary font-medium">
                          <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                          {{ value.job_title }}
                        </span>
                      }
                      @if (value.company_name) {
                        <span class="inline-flex items-center gap-1.5 text-content-secondary font-medium">
                          <span class="text-content-muted">·</span>
                          <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 21h18" />
                            <path d="M9 8h1" /><path d="M9 12h1" /><path d="M9 16h1" />
                            <path d="M14 8h1" /><path d="M14 12h1" /><path d="M14 16h1" />
                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                          </svg>
                          {{ value.company_name }}
                        </span>
                      }
                      @if (value.emirate) {
                        <span class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                          <svg class="h-3 w-3 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {{ value.emirate | titlecase }}
                        </span>
                      }
                      @if (value.industry) {
                        <span class="inline-flex items-center gap-1 rounded-md bg-surface-secondary px-2 py-0.5 font-medium text-content-secondary">
                          {{ value.industry | titlecase }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- View Mode Top Actions -->
                  @if (!editMode) {
                    <div class="flex flex-wrap items-center gap-2.5">
                      @if (value.is_verified) {
                        <span class="rounded-xl border border-border-subtle bg-surface-secondary/60 px-3.5 py-2 text-xs font-semibold text-content-secondary">
                          Verified Member
                        </span>
                      } @else {
                        <a routerLink="/verification" class="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-600 transition-colors">
                          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          Verify Profile
                        </a>
                      }
                      <a routerLink="/my-posts" class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-xs font-semibold text-content-primary hover:border-brand-500 transition-colors">
                        <svg class="h-3.5 w-3.5 text-content-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        My Posts
                      </a>
                    </div>
                  }
                </div>

                <!-- VIEW MODE CONTENT -->
                @if (!editMode) {
                  <div class="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
                    <article class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6">
                      <h2 class="text-base font-bold text-content-primary flex items-center gap-2">
                        <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6" />
                          <line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3.01" y2="6" />
                          <line x1="3" y1="12" x2="3.01" y2="12" />
                          <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                        About
                      </h2>
                      <p class="mt-3 whitespace-pre-line leading-7 text-sm text-content-secondary">
                        {{ value.bio || 'Add a short professional introduction to help people understand your work and background.' }}
                      </p>
                    </article>

                    <article class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6">
                      <h2 class="text-base font-bold text-content-primary flex items-center gap-2">
                        <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        Professional Links
                      </h2>
                      <dl class="mt-4 space-y-3.5 text-sm">
                        @if (value.website_url) {
                          <div class="flex items-start gap-2.5">
                            <dt class="sr-only">Website</dt>
                            <svg class="h-4 w-4 mt-0.5 text-content-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                            <dd class="min-w-0">
                              <a [href]="value.website_url" target="_blank" rel="noopener noreferrer" class="break-all font-medium text-brand-600 hover:underline">
                                {{ value.website_url }}
                              </a>
                            </dd>
                          </div>
                        }
                        @if (value.linkedin_url) {
                          <div class="flex items-start gap-2.5">
                            <dt class="sr-only">LinkedIn</dt>
                            <svg class="h-4 w-4 mt-0.5 text-content-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                            <dd class="min-w-0">
                              <a [href]="value.linkedin_url" target="_blank" rel="noopener noreferrer" class="break-all font-medium text-brand-600 hover:underline">
                                {{ value.linkedin_url }}
                              </a>
                            </dd>
                          </div>
                        }
                        @if (!value.website_url && !value.linkedin_url) {
                          <p class="text-xs text-content-secondary">No professional links added yet.</p>
                        }
                      </dl>
                    </article>
                  </div>
                }

                <!-- EDIT MODE FORM -->
                @if (editMode) {
                  <form class="mt-8 space-y-8" [formGroup]="form" (ngSubmit)="save()" novalidate>
                    <!-- Status / Feedback Message Alert -->
                    @if (message()) {
                      <div
                        role="status"
                        class="flex items-center gap-3 rounded-2xl border px-4.5 py-3.5 text-sm font-medium transition-all"
                        [class.bg-brand-50]="!message().includes('failed') && !message().includes('Use a')"
                        [class.border-brand-200]="!message().includes('failed') && !message().includes('Use a')"
                        [class.text-brand-800]="!message().includes('failed') && !message().includes('Use a')"
                        [class.bg-status-danger/10]="message().includes('failed') || message().includes('Use a')"
                        [class.border-status-danger/30]="message().includes('failed') || message().includes('Use a')"
                        [class.text-status-danger]="message().includes('failed') || message().includes('Use a')"
                      >
                        <svg class="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          @if (message().includes('failed') || message().includes('Use a')) {
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                          } @else {
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                          }
                        </svg>
                        <span>{{ message() }}</span>
                      </div>
                    }

                    <!-- 1. Basic Information Section -->
                    <div class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6 space-y-5">
                      <div class="border-b border-border-subtle pb-3">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                          <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          Basic Information
                        </h2>
                        <p class="text-xs text-content-secondary mt-0.5">Your personal identity and professional summary visible across the UAE community.</p>
                      </div>

                      <div class="grid gap-5 sm:grid-cols-2">
                        <!-- Display Name -->
                        <div class="space-y-1.5">
                          <label for="profile-display-name" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            Display Name <span class="text-status-danger">*</span>
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                            <input
                              id="profile-display-name"
                              formControlName="display_name"
                              placeholder="Your full name"
                              class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                              [class.border-status-danger]="form.controls.display_name.touched && form.controls.display_name.invalid"
                            />
                          </div>
                          @if (form.controls.display_name.touched && form.controls.display_name.errors?.['required']) {
                            <p class="text-xs font-medium text-status-danger">Display name is required.</p>
                          }
                        </div>

                        <!-- Headline -->
                        <div class="space-y-1.5">
                          <label for="profile-headline" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            Headline <span class="text-status-danger">*</span>
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            </div>
                            <input
                              id="profile-headline"
                              formControlName="headline"
                              placeholder="e.g. Managing Partner at Gulf Ventures"
                              class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                              [class.border-status-danger]="form.controls.headline.touched && form.controls.headline.invalid"
                            />
                          </div>
                          @if (form.controls.headline.touched && form.controls.headline.errors?.['required']) {
                            <p class="text-xs font-medium text-status-danger">Headline is required.</p>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- 2. Professional Details Section -->
                    <div class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6 space-y-5">
                      <div class="border-b border-border-subtle pb-3">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                          <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                          Professional Details
                        </h2>
                        <p class="text-xs text-content-secondary mt-0.5">Specify your current role, organization, and UAE business classification.</p>
                      </div>

                      <div class="grid gap-5 sm:grid-cols-2">
                        <!-- Job Title -->
                        <div class="space-y-1.5">
                          <label for="profile-job-title" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            Job Title <span class="text-status-danger">*</span>
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                              </svg>
                            </div>
                            <input
                              id="profile-job-title"
                              formControlName="job_title"
                              placeholder="e.g. Chief Technology Officer"
                              class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                              [class.border-status-danger]="form.controls.job_title.touched && form.controls.job_title.invalid"
                            />
                          </div>
                          @if (form.controls.job_title.touched && form.controls.job_title.errors?.['required']) {
                            <p class="text-xs font-medium text-status-danger">Job title is required.</p>
                          }
                        </div>

                        <!-- Company / Business Name -->
                        <div class="space-y-1.5">
                          <label for="profile-company-name" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            Company / Business Name
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 21h18" />
                                <path d="M9 8h1" /><path d="M9 12h1" /><path d="M9 16h1" />
                                <path d="M14 8h1" /><path d="M14 12h1" /><path d="M14 16h1" />
                                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                              </svg>
                            </div>
                            <input
                              id="profile-company-name"
                              formControlName="company_name"
                              placeholder="e.g. Emirates Tech LLC"
                              class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                            />
                          </div>
                        </div>

                        <!-- Industry -->
                        <div class="space-y-1.5">
                          <label for="profile-industry" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            Industry
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                              </svg>
                            </div>
                            <select
                              id="profile-industry"
                              formControlName="industry"
                              class="w-full appearance-none rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-10 text-sm text-content-primary shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 cursor-pointer"
                            >
                              <option value="">Select an industry</option>
                              @for (option of profile.industries(); track option.value) {
                                <option [value]="option.value">{{ option.label }}</option>
                              }
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <!-- Emirate -->
                        <div class="space-y-1.5">
                          <label for="profile-emirate" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            Emirate
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            </div>
                            <select
                              id="profile-emirate"
                              formControlName="emirate"
                              class="w-full appearance-none rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-10 text-sm text-content-primary shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 cursor-pointer"
                            >
                              <option value="">Select an emirate</option>
                              @for (option of profile.emirates(); track option.value) {
                                <option [value]="option.value">{{ option.label }}</option>
                              }
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 3. About / Bio Section -->
                    <div class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6 space-y-3">
                      <div class="flex items-center justify-between border-b border-border-subtle pb-3">
                        <div>
                          <h2 class="text-sm font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                            <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <line x1="8" y1="6" x2="21" y2="6" />
                              <line x1="8" y1="12" x2="21" y2="12" />
                              <line x1="8" y1="18" x2="21" y2="18" />
                              <line x1="3" y1="6" x2="3.01" y2="6" />
                              <line x1="3" y1="12" x2="3.01" y2="12" />
                              <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                            About / Bio
                          </h2>
                          <p class="text-xs text-content-secondary mt-0.5">Tell other entrepreneurs and leaders about your background and interests.</p>
                        </div>
                        <span class="text-xs font-semibold text-content-muted">
                          {{ form.controls.bio.value.length }} / 2000
                        </span>
                      </div>

                      <div>
                        <label for="profile-bio" class="sr-only">About / Bio</label>
                        <textarea
                          id="profile-bio"
                          formControlName="bio"
                          rows="4"
                          maxlength="2000"
                          placeholder="Share your executive trajectory, key initiatives, investments, or entrepreneurial expertise…"
                          class="w-full resize-y rounded-xl border border-border-subtle bg-white p-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                        ></textarea>
                      </div>
                    </div>

                    <!-- 4. Web & Social Links Section -->
                    <div class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6 space-y-5">
                      <div class="border-b border-border-subtle pb-3">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                          <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          Web & Social Links
                        </h2>
                        <p class="text-xs text-content-secondary mt-0.5">Connect your official website and LinkedIn presence.</p>
                      </div>

                      <div class="grid gap-5 sm:grid-cols-2">
                        <!-- Website URL -->
                        <div class="space-y-1.5">
                          <label for="profile-website-url" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            Website
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                            </div>
                            <input
                              id="profile-website-url"
                              type="url"
                              formControlName="website_url"
                              placeholder="https://example.ae"
                              class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                            />
                          </div>
                        </div>

                        <!-- LinkedIn URL -->
                        <div class="space-y-1.5">
                          <label for="profile-linkedin-url" class="block text-xs font-semibold uppercase tracking-wider text-content-secondary">
                            LinkedIn
                          </label>
                          <div class="relative">
                            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-content-muted">
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                <rect x="2" y="9" width="4" height="12" />
                                <circle cx="4" cy="4" r="2" />
                              </svg>
                            </div>
                            <input
                              id="profile-linkedin-url"
                              type="url"
                              formControlName="linkedin_url"
                              placeholder="https://linkedin.com/in/username"
                              class="w-full rounded-xl border border-border-subtle bg-white py-2.5 pl-10 pr-3.5 text-sm text-content-primary placeholder:text-content-muted shadow-xs transition-all focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 5. Profile Media Assets Section -->
                    <div class="rounded-2xl border border-border-subtle bg-surface-secondary/20 p-5 sm:p-6 space-y-4">
                      <div class="border-b border-border-subtle pb-3">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-content-primary flex items-center gap-2">
                          <svg class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          Media Assets
                        </h2>
                        <p class="text-xs text-content-secondary mt-0.5">Upload high-resolution profile imagery representing your professional standing.</p>
                      </div>

                      <div class="grid gap-4 sm:grid-cols-2">
                        <!-- Avatar Media Card -->
                        <label class="block cursor-pointer rounded-2xl border border-dashed border-border-subtle bg-white p-4.5 transition-all hover:border-brand-400 hover:bg-brand-50/20 group">
                          <div class="flex items-start gap-3.5">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                            </div>
                            <div class="min-w-0 flex-1">
                              <span class="block text-sm font-semibold text-content-primary">Replace avatar</span>
                              <p class="mt-0.5 text-xs text-content-muted">Use a JPEG, PNG, or WebP image up to 5 MB.</p>
                              @if (profile.isUploadingAvatar()) {
                                <p class="mt-1.5 text-xs font-medium text-brand-600 flex items-center gap-1.5">
                                  <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                  Uploading avatar…
                                </p>
                              }
                              <input
                                id="avatar-upload-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                (change)="uploadAvatar($event)"
                                class="mt-2 block w-full text-xs text-content-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                              />
                            </div>
                          </div>
                        </label>

                        <!-- Cover Media Card -->
                        <label class="block cursor-pointer rounded-2xl border border-dashed border-border-subtle bg-white p-4.5 transition-all hover:border-brand-400 hover:bg-brand-50/20 group">
                          <div class="flex items-start gap-3.5">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                            <div class="min-w-0 flex-1">
                              <span class="block text-sm font-semibold text-content-primary">Replace cover</span>
                              <p class="mt-0.5 text-xs text-content-muted">Use a JPEG, PNG, or WebP image up to 8 MB.</p>
                              @if (profile.isUploadingCover()) {
                                <p class="mt-1.5 text-xs font-medium text-brand-600 flex items-center gap-1.5">
                                  <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                                  Uploading cover…
                                </p>
                              }
                              <input
                                id="cover-upload-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                (change)="uploadCover($event)"
                                class="mt-2 block w-full text-xs text-content-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                              />
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <!-- 6. Form Submission & Action Buttons -->
                    <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
                      <!-- Primary Save & Cancel -->
                      <div class="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          [disabled]="profile.isSaving()"
                          class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          @if (profile.isSaving()) {
                            <svg class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                              <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                              <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                            <span>Saving…</span>
                          } @else {
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <polyline points="17 21 17 13 7 13 7 21" />
                              <polyline points="7 3 7 8 15 8" />
                            </svg>
                            <span>Save changes</span>
                          }
                        </button>

                        <a
                          routerLink="/profile"
                          class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-secondary hover:text-content-primary focus-visible:outline-none"
                        >
                          Cancel
                        </a>
                      </div>

                      <!-- Media Deletion Actions -->
                      <div class="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          (click)="deleteAvatar()"
                          [disabled]="!value.avatar_url || profile.isUploadingAvatar()"
                          class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-content-secondary transition-colors hover:border-status-danger/40 hover:bg-status-danger/5 hover:text-status-danger disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Remove avatar
                        </button>

                        <button
                          type="button"
                          (click)="deleteCover()"
                          [disabled]="!value.cover_image_url || profile.isUploadingCover()"
                          class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-content-secondary transition-colors hover:border-status-danger/40 hover:bg-status-danger/5 hover:text-status-danger disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Remove cover
                        </button>
                      </div>
                    </div>
                  </form>
                }

                <!-- Post Management Section (View Mode) -->
                @if (!editMode && posts.myPosts().length) {
                  <section class="mt-8 space-y-4">
                    <h2 class="text-xl font-bold tracking-tight text-content-primary">My posts</h2>
                    @for (item of posts.myPosts(); track item.id) {
                      <app-post-card [post]="item" [management]="true" (edit)="openPost(item.id)" />
                    }
                  </section>
                }
              </div>
            </section>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation (<= 768px) -->
      <app-mobile-bottom-nav />
    </div>
  `,
})
export class ProfileComponent {
  readonly profile = inject(ProfileService);
  readonly posts = inject(PostService);
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly editMode = this.route.snapshot.data['edit'] === true;
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    display_name: ['', [Validators.required, Validators.maxLength(255)]],
    headline: ['', [Validators.required, Validators.maxLength(160)]],
    job_title: ['', [Validators.required, Validators.maxLength(120)]],
    company_name: ['', Validators.maxLength(255)],
    industry: [''],
    emirate: [''],
    bio: ['', Validators.maxLength(2000)],
    website_url: [''],
    linkedin_url: [''],
  });

  constructor() {
    this.profile.getIndustries().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.profile.getEmirates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.profile.getCurrentProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (value) => {
        this.patchProfile(value);
        if (!this.editMode) {
          this.posts.getMyPosts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        }
      },
    });
  }

  initials(name: string | null): string {
    return (name || 'EC')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  save(): void {
    if (this.form.invalid || this.profile.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.message.set('');
    this.profile.updateProfile(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.message.set('Profile saved.'),
      error: (error: unknown) => this.message.set(this.profile.errorMessage(error)),
    });
  }

  uploadAvatar(event: Event): void {
    const file = this.file(event, 5);
    if (file) {
      this.profile.uploadAvatar(file).subscribe({
        next: () => this.message.set('Avatar saved.'),
        error: () => this.message.set('Avatar upload failed.'),
      });
    }
  }

  uploadCover(event: Event): void {
    const file = this.file(event, 8);
    if (file) {
      this.profile.uploadCoverImage(file).subscribe({
        next: () => this.message.set('Cover saved.'),
        error: () => this.message.set('Cover upload failed.'),
      });
    }
  }

  deleteAvatar(): void {
    this.profile.deleteAvatar().subscribe({ next: () => this.message.set('Avatar removed.') });
  }

  deleteCover(): void {
    this.profile.deleteCoverImage().subscribe({ next: () => this.message.set('Cover removed.') });
  }

  logout(): void {
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    } else {
      this.router.navigate(['/search']);
    }
  }

  openPost(id: number): void {
    window.location.assign(`/posts/${id}/edit`);
  }

  private file(event: Event, maxMb: number): File | null {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return null;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > maxMb * 1024 * 1024) {
      this.message.set(`Use a JPEG, PNG, or WebP image up to ${maxMb} MB.`);
      return null;
    }
    return file;
  }

  private patchProfile(profile: {
    display_name: string | null;
    headline: string | null;
    job_title: string | null;
    company_name: string | null;
    industry: string | null;
    emirate: string | null;
    bio: string | null;
    website_url: string | null;
    linkedin_url: string | null;
  }): void {
    this.form.patchValue({
      ...profile,
      display_name: profile.display_name ?? '',
      headline: profile.headline ?? '',
      job_title: profile.job_title ?? '',
      company_name: profile.company_name ?? '',
      industry: profile.industry ?? '',
      emirate: profile.emirate ?? '',
      bio: profile.bio ?? '',
      website_url: profile.website_url ?? '',
      linkedin_url: profile.linkedin_url ?? '',
    });
  }
}
