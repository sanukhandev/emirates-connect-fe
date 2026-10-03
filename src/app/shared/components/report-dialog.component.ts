import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ReportReason, ReportTargetType, REPORT_REASONS } from '../../core/report/report.models';
import { ReportService } from '../../core/report/report.service';

@Component({
  selector: 'app-report-dialog',
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 z-30 flex items-end justify-center bg-content-primary/40 p-0 sm:items-center sm:p-4" role="presentation" tabindex="-1" (click)="closeOnBackdrop($event)" (keydown.escape)="close()">
      <section class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface-card p-6 shadow-card sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title">
        <div class="flex items-start justify-between gap-4"><div><h2 id="report-dialog-title" class="text-xl font-bold">Report {{ targetLabel() }}</h2><p class="mt-2 text-sm text-content-secondary">Tell us what concerns you about this item.</p></div><button type="button" class="rounded-lg p-2 text-content-secondary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand-primary" aria-label="Close report dialog" (click)="close()">×</button></div>
        <form class="mt-6 space-y-5" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label class="block text-sm font-medium" for="report-reason">Reason<select id="report-reason" formControlName="reason" class="auth-input mt-2" [attr.aria-invalid]="form.controls.reason.invalid && form.controls.reason.touched"><option value="">Choose a reason</option>@for (reason of reasons; track reason.value) { <option [value]="reason.value">{{ reason.label }}</option> }</select></label>
          @if (form.controls.reason.touched && form.controls.reason.invalid) { <p class="text-sm text-status-danger" role="alert">Choose a reason.</p> }
          <label class="block text-sm font-medium" for="report-details">Details <span class="font-normal text-content-muted">{{ form.controls.details.value.length }}/2000</span><textarea id="report-details" formControlName="details" maxlength="2000" rows="5" class="auth-input mt-2 resize-y" [attr.aria-describedby]="form.controls.details.invalid && form.controls.details.touched ? 'report-details-error' : null" placeholder="Add context if useful"></textarea></label>
          @if (form.controls.details.touched && form.controls.details.invalid) { <p id="report-details-error" class="text-sm text-status-danger" role="alert">Details are required for Other and must be 2000 characters or fewer.</p> }
          @if (error()) { <p class="rounded-xl bg-status-danger/10 p-3 text-sm text-status-danger" role="alert" aria-live="polite">{{ error() }}</p> }
          <div class="flex flex-wrap justify-end gap-3"><button type="button" class="rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium" (click)="close()" [disabled]="submitting()">Cancel</button><button type="submit" class="rounded-xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60" [disabled]="submitting()">{{ submitting() ? 'Submitting…' : 'Submit report' }}</button></div>
        </form>
      </section>
    </div>
  `,
})
export class ReportDialogComponent {
  readonly targetType = input.required<ReportTargetType>();
  readonly targetId = input.required<number>();
  readonly targetLabel = input('item');
  readonly closed = output<'submitted' | 'cancelled'>();
  readonly reasons = REPORT_REASONS;
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({ reason: ['', Validators.required], details: ['', Validators.maxLength(2000)] });
  private readonly service = inject(ReportService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.form.controls.reason.valueChanges.pipe(takeUntilDestroyed()).subscribe((reason) => {
      const details = this.form.controls.details;
      if (reason === 'other') details.addValidators(Validators.required);
      else details.removeValidators(Validators.required);
      details.updateValueAndValidity({ emitEvent: false });
    });
  }

  closeOnBackdrop(event: MouseEvent): void { if (event.target === event.currentTarget) this.close(); }
  close(): void { if (!this.submitting()) this.closed.emit('cancelled'); }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;
    const reason = this.form.controls.reason.value as ReportReason;
    this.submitting.set(true); this.error.set('');
    this.service.createReport({ target_type: this.targetType(), target_id: this.targetId(), reason, details: this.form.controls.details.value.trim() || undefined }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.submitting.set(false); this.closed.emit('submitted'); },
      error: (error: unknown) => { this.submitting.set(false); this.error.set(this.errorMessage(error)); },
    });
  }

  private errorMessage(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 401) return 'Please sign in to report this item.';
    if (status === 404) return 'This item is no longer available.';
    if (status === 409) return 'You have already reported this item.';
    if (status === 422) return 'Please check the selected reason and details.';
    if (status === 429) return 'You have submitted several reports recently. Please try again later.';
    return 'Unable to submit report. Please try again.';
  }
}
