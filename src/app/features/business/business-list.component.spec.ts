import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { BusinessService } from '../../core/business/business.service';
import { Business } from '../../core/business/business.models';
import { BusinessListComponent } from './business-list.component';

const mockBusinesses: Business[] = [
  {
    id: 1,
    name: 'Gulf Innovation Labs',
    slug: 'gulf-innovation-labs',
    tagline: 'Leading AI ventures',
    description: 'Venture studio in Dubai',
    industry: 'technology',
    emirate: 'dubai',
    website_url: 'https://gil.ae',
    email: 'info@gil.ae',
    phone: '+971501234567',
    logo_url: null,
    cover_image_url: null,
    status: 'active',
    current_user_role: 'owner',
    is_verified: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('BusinessListComponent', () => {
  it('renders businesses and filters locally by query', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance.filteredBusinesses().length).toBe(1);
    expect(fixture.componentInstance.filteredBusinesses()[0].name).toBe('Gulf Innovation Labs');

    fixture.componentInstance.searchQuery.set('nonexistent');
    expect(fixture.componentInstance.filteredBusinesses().length).toBe(0);

    fixture.componentInstance.searchQuery.set('gulf');
    expect(fixture.componentInstance.filteredBusinesses().length).toBe(1);
  });

  it('handles image error states gracefully', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance.isLogoFailed(1)).toBe(false);
    fixture.componentInstance.onLogoError(1);
    expect(fixture.componentInstance.isLogoFailed(1)).toBe(true);

    expect(fixture.componentInstance.isCoverFailed(1)).toBe(false);
    fixture.componentInstance.onCoverError(1);
    expect(fixture.componentInstance.isCoverFailed(1)).toBe(true);
  });
});

function createFixture() {
  const businessServiceMock = {
    myBusinesses: signal(mockBusinesses),
    myBusinessesMeta: signal({ current_page: 1, last_page: 1, per_page: 20 }),
    isLoading: signal(false),
    getMyBusinesses: vi.fn().mockReturnValue(of({ data: mockBusinesses, meta: { current_page: 1, last_page: 1 } })),
    errorMessage: vi.fn().mockReturnValue('Error'),
  };

  const authServiceMock = {
    currentUser: signal({ name: 'Sanu Khan', email: 'sanu@example.com' }),
    logout: vi.fn().mockReturnValue(of(null)),
  };

  const profileServiceMock = {
    profile: signal(null),
  };

  TestBed.configureTestingModule({
    imports: [BusinessListComponent],
    providers: [
      { provide: BusinessService, useValue: businessServiceMock },
      { provide: AuthService, useValue: authServiceMock },
      { provide: ProfileService, useValue: profileServiceMock },
      provideRouter([]),
    ],
  });

  return TestBed.createComponent(BusinessListComponent);
}
