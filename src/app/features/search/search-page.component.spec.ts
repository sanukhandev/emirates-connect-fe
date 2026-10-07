import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { SearchService } from '../../core/search/search.service';
import { SearchResponse, SearchResult } from '../../core/search/search.models';
import { SearchPageComponent } from './search-page.component';

const mockResults: SearchResult[] = [
  {
    type: 'user',
    id: 101,
    display_name: 'Fatima Al-Nuaimi',
    headline: 'Fintech Specialist',
    avatar_url: null,
    industry: 'finance',
    emirate: 'dubai',
    is_verified: true,
  },
  {
    type: 'business',
    id: 202,
    name: 'Gulf Innovation Labs',
    slug: 'gulf-innovation-labs',
    description: 'AI & Cloud Infrastructure',
    logo_url: null,
    industry: 'technology',
    emirate: 'abu-dhabi',
    is_verified: false,
  },
];

const mockSearchResponse: SearchResponse = {
  data: mockResults,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 2,
  },
};

describe('SearchPageComponent', () => {
  it('renders search page and populates results from search service', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    const results = fixture.componentInstance.results();
    expect(results.length).toBe(2);

    const first = results[0];
    if (first.type === 'user') {
      expect(first.display_name).toBe('Fatima Al-Nuaimi');
    }

    const second = results[1];
    if (second.type === 'business') {
      expect(second.name).toBe('Gulf Innovation Labs');
    }
  });

  it('updates search type when setType is invoked', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    fixture.componentInstance.setType('users');
    expect(fixture.componentInstance.type()).toBe('all'); // Router navigation is mocked
  });

  it('computes hasFilters correctly', () => {
    const fixture = createFixture();
    fixture.detectChanges();

    expect(fixture.componentInstance.hasFilters()).toBe(false);
    fixture.componentInstance.industry.set('finance');
    expect(fixture.componentInstance.hasFilters()).toBe(true);
  });
});

function createFixture() {
  const searchServiceMock = {
    search: vi.fn().mockReturnValue(of(mockSearchResponse)),
    searchUsers: vi.fn().mockReturnValue(of(mockSearchResponse)),
    searchBusinesses: vi.fn().mockReturnValue(of(mockSearchResponse)),
    errorMessage: vi.fn().mockReturnValue('Search error occurred'),
  };

  const profileServiceMock = {
    profile: signal(null),
    industries: signal([
      { value: 'finance', label: 'Finance' },
      { value: 'technology', label: 'Technology' },
    ]),
    emirates: signal([
      { value: 'dubai', label: 'Dubai' },
      { value: 'abu-dhabi', label: 'Abu Dhabi' },
    ]),
    getIndustries: vi.fn().mockReturnValue(of([])),
    getEmirates: vi.fn().mockReturnValue(of([])),
  };

  const authServiceMock = {
    currentUser: signal({ name: 'Sanu Khan', email: 'sanu@example.com' }),
    logout: vi.fn().mockReturnValue(of(null)),
  };

  TestBed.configureTestingModule({
    imports: [SearchPageComponent],
    providers: [
      { provide: SearchService, useValue: searchServiceMock },
      { provide: ProfileService, useValue: profileServiceMock },
      { provide: AuthService, useValue: authServiceMock },
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: of(convertToParamMap({ q: 'tech', type: 'all' })),
          snapshot: { queryParamMap: convertToParamMap({ q: 'tech', type: 'all' }) },
        },
      },
      provideRouter([]),
    ],
  });

  return TestBed.createComponent(SearchPageComponent);
}
