import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin/admin.service';

@Component({
  selector: 'app-admin-events',
  imports: [ReactiveFormsModule, RouterLink],
  template: `<main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-10 lg:py-8"><div class="mx-auto max-w-3xl"><a routerLink="/admin" class="text-sm font-semibold text-brand-strong">← Admin console</a><section class="mt-6 rounded-3xl bg-surface-card p-6 shadow-card sm:p-8"><p class="text-sm font-medium uppercase tracking-[0.16em] text-brand-strong">Platform event</p><h1 class="mt-2 text-3xl font-bold">Create upcoming UAE event</h1><p class="mt-2 text-sm text-content-secondary">Only system administrators can publish events. Published events are highlighted at the top of the home feed until they start.</p><form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="save()"><label class="block text-sm font-medium">Title<input formControlName="title" class="admin-input mt-2 w-full" /></label><label class="block text-sm font-medium">Description<textarea formControlName="description" rows="4" class="admin-textarea mt-2 w-full"></textarea></label><div class="grid gap-5 sm:grid-cols-2"><label class="block text-sm font-medium">Venue<input formControlName="venue" class="admin-input mt-2 w-full" /></label><label class="block text-sm font-medium">Emirate<input formControlName="emirate" class="admin-input mt-2 w-full" placeholder="Dubai" /></label></div><div class="grid gap-5 sm:grid-cols-2"><label class="block text-sm font-medium">Starts at<input type="datetime-local" formControlName="starts_at" class="admin-input mt-2 w-full" /></label><label class="block text-sm font-medium">Ends at<input type="datetime-local" formControlName="ends_at" class="admin-input mt-2 w-full" /></label></div>@if (message()) {<p role="status" class="text-sm text-status-success">{{ message() }}</p>}@if (error()) {<p role="alert" class="text-sm text-status-danger">{{ error() }}</p>}<button type="submit" class="rounded-xl bg-brand-primary px-4 py-3 font-semibold text-white disabled:opacity-50" [disabled]="form.invalid || saving()">{{ saving() ? 'Publishing…' : 'Publish event' }}</button></form></section></div></main>`,
})
export class AdminEventsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminService);
  readonly saving = signal(false); readonly message = signal<string | null>(null); readonly error = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({ title: ['', [Validators.required, Validators.maxLength(160)]], description: ['', Validators.maxLength(5000)], venue: ['', Validators.maxLength(160)], emirate: [''], starts_at: ['', Validators.required], ends_at: [''] });
  save(): void { if (this.form.invalid || this.saving()) return; this.saving.set(true); this.message.set(null); this.error.set(null); this.admin.createEvent(this.form.getRawValue()).subscribe({ next: () => { this.message.set('Event published and highlighted in the home feed.'); this.form.reset(); }, error: () => this.error.set('Unable to publish this event.'), complete: () => this.saving.set(false) }); }
}
