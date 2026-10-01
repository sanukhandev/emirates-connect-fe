import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { BusinessService } from '../../core/business/business.service';
import { Business, BusinessMember, BusinessRole } from '../../core/business/business.models';
import { canManageEditors, memberRoleOptions } from '../../core/business/business.permissions';

@Component({
  selector: 'app-business-members',
  imports: [RouterLink, ReactiveFormsModule, DatePipe, TitleCasePipe],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <a [routerLink]="['/businesses', slug]" class="text-sm font-medium text-brand-strong">← Business page</a>
        @if (business.isLoading() && !business.currentBusiness()) {
          <div class="mt-6 h-80 animate-pulse rounded-3xl bg-surface-muted"></div>
        } @else if (error()) {
          <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card">
            <h1 class="text-2xl font-bold">{{ error() }}</h1>
            <a [routerLink]="['/businesses', slug]" class="mt-5 inline-flex rounded-xl border border-border-subtle px-4 py-3 text-sm">Return to business</a>
          </section>
        } @else if (business.currentBusiness(); as item) {
          <header class="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div><p class="text-sm font-medium text-brand-strong">{{ item.name }}</p><h1 class="mt-2 text-3xl font-bold">Members</h1><p class="mt-2 text-content-secondary">Manage people who operate this business page.</p></div>
            <span class="rounded-full bg-brand-soft px-3 py-1 text-sm font-medium capitalize text-brand-strong">{{ item.current_user_role }}</span>
          </header>
          @if (!canManage(item.current_user_role)) {
            <section class="mt-8 rounded-3xl bg-surface-card p-8 text-center shadow-card"><h2 class="text-xl font-bold">Management unavailable</h2><p class="mt-2 text-content-secondary">You do not have permission to manage members.</p></section>
          } @else {
            <section class="mt-8 rounded-3xl bg-surface-card p-5 shadow-card sm:p-6">
              <h2 class="text-lg font-semibold">Add an existing user</h2><p class="mt-1 text-sm text-content-secondary">Use an existing Emirates Connect User ID. Invitations are not available yet.</p>
              <form class="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" [formGroup]="addForm" (ngSubmit)="add()">
                <label class="block text-sm font-medium" for="member-user-id">Existing Emirates Connect User ID<input id="member-user-id" type="number" min="1" formControlName="user_id" class="auth-input" /></label>
                <label class="block text-sm font-medium" for="member-role">Role<select id="member-role" formControlName="role" class="auth-input">@for (role of roles(item.current_user_role); track role) { <option [value]="role">{{ role | titlecase }}</option> }</select></label>
                <button type="submit" class="auth-button sm:max-w-40" [disabled]="business.isSaving()">{{ business.isSaving() ? 'Adding…' : 'Add member' }}</button>
              </form>
              @if (message()) { <p role="status" aria-live="polite" class="mt-4 text-sm text-content-secondary">{{ message() }}</p> }
            </section>
            <section class="mt-5 space-y-3">
              @if (business.isLoading()) { <div class="h-24 animate-pulse rounded-2xl bg-surface-muted"></div> }
              @else if (!business.members().length) { <div class="rounded-3xl bg-surface-card p-8 text-center text-content-secondary">No members found.</div> }
              @else { @for (member of business.members(); track member.id) {
                <article class="flex flex-wrap items-center gap-4 rounded-2xl bg-surface-card p-4 shadow-card">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-bold text-brand-strong">@if (member.user.profile?.avatar_url; as avatarUrl) { <img [src]="avatarUrl" [alt]="memberName(member) + ' profile photo'" class="h-full w-full object-cover" /> } @else { {{ initials(memberName(member)) }} }</div>
                  <div class="min-w-0 flex-1"><h2 class="font-semibold">{{ memberName(member) }}</h2><p class="truncate text-sm text-content-secondary">{{ member.user.profile?.headline || 'Emirates Connect member' }}</p><p class="text-xs text-content-muted">Added {{ member.created_at | date:'mediumDate' }}</p></div>
                  <span class="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium capitalize text-brand-strong">{{ member.role }}</span>
                  @if (member.role !== 'owner') {
                    @if (item.current_user_role === 'owner') { <select [value]="member.role" [attr.aria-label]="'Change role for ' + memberName(member)" class="rounded-xl border border-border-subtle bg-surface-muted px-3 py-2 text-sm" (change)="changeRole(member, $event)"><option value="admin">Admin</option><option value="editor">Editor</option></select> }
                    @if (canRemove(item.current_user_role, member.role)) { <button type="button" class="rounded-xl border border-status-danger/40 px-3 py-2 text-sm text-status-danger" (click)="remove(member)">Remove</button> }
                  }
                </article>
              } }
            </section>
            @if (business.membersMeta(); as meta) { <nav class="mt-6 flex items-center justify-between gap-4 text-sm" aria-label="Member pages"><button type="button" class="rounded-xl border border-border-subtle px-4 py-2 disabled:opacity-50" (click)="loadMembers(meta.current_page - 1)" [disabled]="meta.current_page <= 1 || business.isLoading()">Previous</button><span>Page {{ meta.current_page }} of {{ meta.last_page }}</span><button type="button" class="rounded-xl border border-border-subtle px-4 py-2 disabled:opacity-50" (click)="loadMembers(meta.current_page + 1)" [disabled]="meta.current_page >= meta.last_page || business.isLoading()">Next</button></nav> }
          }
        }
        @if (pendingRemoval(); as member) {
          <div class="fixed inset-0 z-10 flex items-center justify-center bg-content-primary/40 px-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="remove-member-title" class="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-card"><h2 id="remove-member-title" class="text-xl font-bold">Remove member?</h2><p class="mt-2 text-sm text-content-secondary">Remove {{ memberName(member) }} from this business?</p><div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm" (click)="pendingRemoval.set(null)">Cancel</button><button type="button" class="rounded-xl bg-status-danger px-4 py-3 text-sm font-medium text-white disabled:opacity-60" (click)="confirmRemove()" [disabled]="business.isSaving()">{{ business.isSaving() ? 'Removing…' : 'Remove member' }}</button></div></section></div>
        }
      </div>
    </main>
  `,
})
export class BusinessMembersComponent {
  readonly business = inject(BusinessService);
  readonly error = signal('');
  readonly message = signal('');
  readonly pendingRemoval = signal<BusinessMember | null>(null);
  readonly slug: string;
  readonly addForm = inject(FormBuilder).nonNullable.group({ user_id: [0, [Validators.required, Validators.min(1)]], role: ['editor' as 'admin' | 'editor', Validators.required] });
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    if (!this.slug) { this.error.set('Business not found.'); return; }
    this.business.getBusiness(this.slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (item) => this.loadMembers(1, item), error: (error: unknown) => this.error.set(this.business.errorMessage(error)) });
  }

  canManage = canManageEditors;
  roles = memberRoleOptions;

  loadMembers(page = 1, item?: Business): void {
    if (item && !canManageEditors(item.current_user_role)) return;
    this.business.getMembers(this.slug, page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: (error: unknown) => this.error.set(this.business.errorMessage(error)) });
  }

  add(): void {
    if (this.addForm.invalid || this.business.isSaving()) { this.addForm.markAllAsTouched(); return; }
    this.message.set('');
    this.business.addMember(this.slug, this.addForm.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.message.set('Member added.'); this.addForm.reset({ user_id: 0, role: this.addForm.controls.role.value }); this.loadMembers(); }, error: (error: unknown) => this.message.set(this.business.errorMessage(error)) });
  }

  changeRole(member: BusinessMember, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as 'admin' | 'editor';
    this.business.updateMemberRole(this.slug, member.id, role).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.loadMembers(), error: (error: unknown) => this.message.set(this.business.errorMessage(error)) });
  }

  remove(member: BusinessMember): void { this.pendingRemoval.set(member); }

  confirmRemove(): void {
    const member = this.pendingRemoval();
    if (!member) return;
    this.business.removeMember(this.slug, member.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.loadMembers(), error: (error: unknown) => this.message.set(this.business.errorMessage(error)) });
    this.pendingRemoval.set(null);
  }

  canRemove(role: BusinessRole | null, memberRole: BusinessRole): boolean { return (role === 'owner' && memberRole !== 'owner') || (role === 'admin' && memberRole === 'editor'); }
  memberName(member: BusinessMember): string { return member.user.profile?.display_name || member.user.name; }
  initials(name: string): string { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
}
