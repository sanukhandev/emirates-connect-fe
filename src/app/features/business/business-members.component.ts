import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../core/business/business.service';
import { Business, BusinessMember, BusinessRole } from '../../core/business/business.models';
import { canManageEditors, memberRoleOptions } from '../../core/business/business.permissions';
import { DesktopSidebarComponent } from '../../layout/desktop-sidebar/desktop-sidebar.component';
import { MobileHeaderComponent } from '../../layout/mobile-header/mobile-header.component';
import { MobileBottomNavComponent } from '../../layout/mobile-bottom-nav/mobile-bottom-nav.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-business-members',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe,
    DesktopSidebarComponent,
    MobileHeaderComponent,
    MobileBottomNavComponent,
    AppHeaderComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="min-h-screen bg-canvas text-content-primary">
      <!-- Mobile Header (<= 768px) -->
      <app-mobile-header />

      <!-- Main Shell Container -->
      <div class="mx-auto flex max-w-[1440px] justify-center gap-6 px-3.5 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-6">
        <!-- 1. Left Desktop Sidebar -->
        <div class="hidden md:block shrink-0">
          <app-desktop-sidebar (logoutClick)="logout()" />
        </div>

        <!-- 2. Main Content Column -->
        <main class="w-full max-w-[920px] shrink min-w-0 space-y-6 pb-20 md:pb-10">
          <!-- Top Application Header -->
          <app-header />

          <!-- Loading Shimmer -->
          @if (business.isLoading() && !business.currentBusiness()) {
            <div class="h-80 animate-pulse rounded-3xl bg-surface-muted"></div>
          } @else if (error()) {
            <app-empty-state
              icon="info"
              title="Business not found"
              [description]="error()"
              actionLabel="Return to businesses"
              actionRoute="/businesses"
            />
          } @else if (business.currentBusiness(); as item) {
            <!-- Header Card -->
            <header class="rounded-3xl border border-border-subtle bg-surface-card p-5 sm:p-6 shadow-card">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-5">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{{ item.name }}</span>
                    <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-brand-700">
                      {{ item.current_user_role }}
                    </span>
                  </div>
                  <h1 class="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
                    Manage Team Members
                  </h1>
                  <p class="mt-1 text-xs sm:text-sm text-content-secondary">
                    Grant administrative or editor access to people who operate this business page.
                  </p>
                </div>

                <a
                  [routerLink]="['/businesses', slug]"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-secondary px-3.5 py-2 text-xs font-semibold text-content-primary transition hover:border-brand-primary/40 hover:text-brand-primary"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span>Business page</span>
                </a>
              </div>

              <!-- Permission Notice or Add Form -->
              @if (!canManage(item.current_user_role)) {
                <div class="mt-5 rounded-2xl bg-surface-secondary p-4 text-xs sm:text-sm text-content-secondary">
                  You have read-only access to this business roster. Only business owners and administrators can add or remove members.
                </div>
              } @else {
                <!-- Add Member Form Section -->
                <section class="mt-6 rounded-2xl border border-border-subtle bg-surface-secondary/40 p-4 sm:p-5">
                  <h2 class="text-sm font-bold text-content-primary">Add an existing user</h2>
                  <p class="mt-0.5 text-xs text-content-secondary">
                    Enter the numeric Emirates Connect User ID and assign their management role.
                  </p>

                  <form class="mt-4 grid gap-3.5 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end" [formGroup]="addForm" (ngSubmit)="add()">
                    <label class="block text-xs font-semibold text-content-primary" for="member-user-id">
                      User ID
                      <input
                        id="member-user-id"
                        type="number"
                        min="1"
                        placeholder="e.g. 42"
                        formControlName="user_id"
                        class="ec-input mt-1.5"
                      />
                    </label>

                    <label class="block text-xs font-semibold text-content-primary" for="member-role">
                      Role
                      <select id="member-role" formControlName="role" class="ec-input mt-1.5">
                        @for (role of roles(item.current_user_role); track role) {
                          <option [value]="role">{{ role | titlecase }}</option>
                        }
                      </select>
                    </label>

                    <button
                      type="submit"
                      class="ec-btn-primary h-[42px] px-5"
                      [disabled]="business.isSaving()"
                    >
                      {{ business.isSaving() ? 'Adding…' : 'Add member' }}
                    </button>
                  </form>

                  @if (message()) {
                    <p role="status" aria-live="polite" class="mt-3 text-xs font-semibold text-brand-strong">
                      {{ message() }}
                    </p>
                  }
                </section>
              }
            </header>

            <!-- Members List Section -->
            <section class="space-y-3" aria-label="Business member roster">
              <div class="flex items-center justify-between pb-1">
                <h2 class="text-base font-bold text-content-primary">Team Roster</h2>
                @if (business.members().length) {
                  <span class="text-xs font-semibold text-content-muted">{{ business.members().length }} members</span>
                }
              </div>

              @if (business.isLoading()) {
                <div class="h-24 animate-pulse rounded-2xl bg-surface-muted"></div>
              } @else if (!business.members().length) {
                <app-empty-state
                  icon="users"
                  title="No members found"
                  description="This business does not have any team members assigned yet."
                />
              } @else {
                <div class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-card divide-y divide-border-subtle">
                  @for (member of business.members(); track member.id) {
                    <article class="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-secondary/40">
                      <!-- User Info -->
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 font-bold text-brand-700">
                          @if (member.user.profile?.avatar_url; as avatarUrl) {
                            <img [src]="avatarUrl" [alt]="memberName(member)" class="h-full w-full object-cover" />
                          } @else {
                            {{ initials(memberName(member)) }}
                          }
                        </div>
                        <div class="min-w-0">
                          <h3 class="truncate text-sm font-bold text-content-primary">{{ memberName(member) }}</h3>
                          <p class="truncate text-xs text-content-secondary leading-tight mt-0.5">
                            {{ member.user.profile?.headline || 'Emirates Connect member' }}
                          </p>
                          <p class="text-[11px] text-content-muted leading-tight mt-0.5">
                            Added {{ member.created_at | date:'mediumDate' }}
                          </p>
                        </div>
                      </div>

                      <!-- Role & Controls -->
                      <div class="flex items-center gap-2.5">
                        <span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">
                          {{ member.role }}
                        </span>

                        @if (member.role !== 'owner') {
                          @if (item.current_user_role === 'owner') {
                            <select
                              [value]="member.role"
                              [attr.aria-label]="'Change role for ' + memberName(member)"
                              class="rounded-xl border border-border-subtle bg-surface-secondary px-3 py-1.5 text-xs font-medium text-content-primary outline-none focus:border-brand-primary"
                              (change)="changeRole(member, $event)"
                            >
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
                            </select>
                          }

                          @if (canRemove(item.current_user_role, member.role)) {
                            <button
                              type="button"
                              class="ec-btn-danger px-3 py-1.5 text-xs"
                              (click)="remove(member)"
                            >
                              Remove
                            </button>
                          }
                        }
                      </div>
                    </article>
                  }
                </div>
              }

              <!-- Pagination -->
              @if (business.membersMeta(); as meta) {
                @if (meta.last_page > 1) {
                  <nav class="flex items-center justify-between gap-4 pt-2 text-xs sm:text-sm" aria-label="Member pages">
                    <button
                      type="button"
                      class="ec-btn-secondary px-3.5 py-2"
                      (click)="loadMembers(meta.current_page - 1)"
                      [disabled]="meta.current_page <= 1 || business.isLoading()"
                    >
                      Previous
                    </button>
                    <span class="text-content-muted">Page {{ meta.current_page }} of {{ meta.last_page }}</span>
                    <button
                      type="button"
                      class="ec-btn-secondary px-3.5 py-2"
                      (click)="loadMembers(meta.current_page + 1)"
                      [disabled]="meta.current_page >= meta.last_page || business.isLoading()"
                    >
                      Next
                    </button>
                  </nav>
                }
              }
            </section>
          }
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <app-mobile-bottom-nav />
    </div>

    <!-- Removal Confirmation Modal -->
    @if (pendingRemoval(); as member) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-content-primary/40 px-4 backdrop-blur-xs" role="presentation">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
          class="w-full max-w-md rounded-3xl border border-border-subtle bg-surface-card p-6 shadow-card"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger/10 text-status-danger">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="18" y1="8" x2="23" y2="13" />
              <line x1="23" y1="8" x2="18" y2="13" />
            </svg>
          </div>
          <h2 id="remove-member-title" class="mt-4 text-xl font-bold text-content-primary">Remove team member?</h2>
          <p class="mt-2 text-xs sm:text-sm text-content-secondary leading-relaxed">
            Are you sure you want to revoke page management privileges for <strong>{{ memberName(member) }}</strong>?
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="ec-btn-secondary"
              (click)="pendingRemoval.set(null)"
            >
              Cancel
            </button>
            <button
              type="button"
              class="ec-btn-danger"
              (click)="confirmRemove()"
              [disabled]="business.isSaving()"
            >
              {{ business.isSaving() ? 'Removing…' : 'Remove member' }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
})
export class BusinessMembersComponent {
  readonly business = inject(BusinessService);
  private readonly auth = inject(AuthService);
  readonly error = signal('');
  readonly message = signal('');
  readonly pendingRemoval = signal<BusinessMember | null>(null);
  readonly slug: string;
  readonly addForm = inject(FormBuilder).nonNullable.group({
    user_id: [0, [Validators.required, Validators.min(1)]],
    role: ['editor' as 'admin' | 'editor', Validators.required],
  });
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    if (!this.slug) {
      this.error.set('Business not found.');
      return;
    }
    this.business.getBusiness(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => this.loadMembers(1, item),
      error: (error: unknown) => this.error.set(this.business.errorMessage(error)),
    });
  }

  logout(): void {
    this.auth.logout();
  }

  canManage = canManageEditors;
  roles = memberRoleOptions;

  canRemove(currentUserRole: BusinessRole | null | undefined, targetRole: BusinessRole): boolean {
    if (!currentUserRole) return false;
    if (currentUserRole === 'owner') return targetRole !== 'owner';
    if (currentUserRole === 'admin') return targetRole === 'editor';
    return false;
  }

  memberName(member: BusinessMember): string {
    return member.user.profile?.display_name || member.user.name;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  loadMembers(page = 1, item?: Business): void {
    if (item && !canManageEditors(item.current_user_role)) return;
    this.business.getMembers(this.slug, page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.error.set(this.business.errorMessage(error)),
    });
  }

  add(): void {
    if (this.addForm.invalid || this.business.isSaving()) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.message.set('');
    this.business.addMember(this.slug, this.addForm.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.message.set('Member added successfully.');
        this.addForm.reset({ user_id: 0, role: this.addForm.controls.role.value });
        this.loadMembers();
      },
      error: (error: unknown) => this.message.set(this.business.errorMessage(error)),
    });
  }

  changeRole(member: BusinessMember, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as 'admin' | 'editor';
    this.business.updateMemberRole(this.slug, member.id, role).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadMembers(),
      error: (error: unknown) => this.message.set(this.business.errorMessage(error)),
    });
  }

  remove(member: BusinessMember): void {
    this.pendingRemoval.set(member);
  }

  confirmRemove(): void {
    const member = this.pendingRemoval();
    if (!member) return;
    this.business.removeMember(this.slug, member.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.pendingRemoval.set(null);
        this.loadMembers();
      },
      error: (error: unknown) => {
        this.pendingRemoval.set(null);
        this.message.set(this.business.errorMessage(error));
      },
    });
  }
}
