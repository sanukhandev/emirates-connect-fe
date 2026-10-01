import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { BusinessFormComponent } from './business-form.component';
import { Business } from '../../core/business/business.models';

@Component({
  selector: 'app-business-create',
  imports: [BusinessFormComponent, RouterLink],
  template: `
    <main class="min-h-screen bg-canvas px-4 py-6 text-content-primary sm:px-6 lg:px-8"><div class="mx-auto max-w-4xl"><a routerLink="/businesses" class="text-sm font-medium text-brand-strong">← Businesses</a><section class="mt-6 rounded-3xl bg-surface-card p-5 shadow-card sm:p-8"><p class="text-sm font-medium text-brand-strong">Business presence</p><h1 class="mt-2 text-3xl font-bold">Create a business page</h1><p class="mt-2 max-w-2xl text-content-secondary">Share the essentials of your business with the Emirates Connect community.</p><div class="mt-8"><app-business-form submitLabel="Create business" (saved)="created($event)" /></div></section></div></main>
  `,
})
export class BusinessCreateComponent {
  private readonly router = inject(Router);

  created(business: Business): void { void this.router.navigate(['/businesses', business.slug]); }
}
